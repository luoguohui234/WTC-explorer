var async = require('async');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');

var exporter = function(config, db) {
  var self = this;
  self.config = config;
  self.db = db;
  
  self.web3 = new Web3();
  self.web3.setProvider(config.provider);
  
  self.contract = self.web3.eth.contract(config.erc20ABI).at(config.tokenAddress);
  self.newEvents = self.contract.allEvents();
  
  self.state = { _id: "exporterState", analysisBlock: 0, initApply: false };

  // Processes new events
  self.newEvents.watch(function(err, log) {
    if (err) {
      console.log("Error receiving new log:", err);
      return;
    }
    console.log("New log received:", log);
    
    self.processLog(log, function(err) {
      console.log("New log processed");
    });
    
    if (log.event === "Transfer") {
      self.exportBalance(log.args._from);
      self.exportBalance(log.args._to);
    }
    if (log.event === "Approval") {
      self.exportBalance(log.args._owner);
      self.exportBalance(log.args._spender);
    }
  });

  async.waterfall([
    function(callback) {
      self.web3.eth.getBlockNumber(function (error, result) { 
        console.log("Eth get block number:", result);
        if (result > 0) {
          config.analysisStepMax = result - 2000;
        }
        callback(null);
      });
    },
    function(callback) {
      self.db.collection(config.tableStateName).find({ _id: self.state._id }).toArray(function (err, result) {
        if (err) {
          console.log("Restore state err:", err);
        } else if (result && result.length != 0) {
          console.log("Restore result:", result);
          self.state = result[0];
        }
        callback(null);
      });
    },
    function(callback) {
      self.initApply(function() {
        callback(null);
      });
    },
    function(callback) {
      self.startAnalysis();
    }
  ], function (err, result) {
      if (err) {
        console.log(err);
      }
      console.log("Waterfall1 end");
  });

  self.initApply = function() {
    async.waterfall([
      function(callback) {
        if (!self.state.initApply) {
          self.db.collection(config.tableBlanceName).find({ _id: config.initApplyAddress }).toArray(function(err, result) {
            if (err || result.length <= 0) {
              callback(null, 0);
              return;
            }

            callback(null, result[0].balance);
          });
        } else {
          callback("Already init applay");
        }
      },
      function(balance, callback) {

        console.log("Save to collection balance, address:", config.initApplyAddress, " balance:", balance);

        var result = (new BigNumber(10)).toPower(config.tokenDecimals);
        result = result.mul(config.tokenTotalSupply);
        result = result.toNumber() + balance;

        var doc = { _id: config.initApplyAddress, balance: result };
        self.db.collection(config.tableBlanceName).update({ _id: doc._id }, doc, { upsert: true }, function(err, numReplaced) {
          if (err) {
            console.log("Error updating balance:", err);
          } else {
            console.log("Balance export completed");
          }
          
          callback(null);
        });
      },
      function(callback) {
        self.state.initApply = true;
        self.saveState(function() {
          callback(null);
        });
      }
    ], function (err, result) {
      if (err) {
        console.log(err);
      }
      console.log("Waterfall3 end");
    });
  }

  self.startAnalysis = function() {
    async.whilst(
      function() {
        console.log("self.state:", self.state, " analysisBlock:", self.state.analysisBlock,
          " config.analysisStepMax:", config.analysisStepMax);
        return self.state.analysisBlock <= config.analysisStepMax;
      },
      function(callback) {
        self.analysisOldEvents(self.state.analysisBlock, function() {
          self.state.analysisBlock += config.analysisStep;
          self.saveState();
          callback();
        });
      },
      function(err) {  
        if (err) {
          console.log(err);
        }
        console.log('whilst end');  
      }
    );
  }

  self.analysisOldEvents = function(from, callback) {
    var to = from + config.analysisStep - 1;
    if (to > config.analysisStepMax)
      to = "latest";

    console.log("Analysis events from:", from, " to:", to);
    self.allEvents = self.contract.allEvents({fromBlock: from/*config.exportStartBlock*/, toBlock: to/*"latest"*/});

    // Retrieves historical events and processed them
    self.allEvents.get(function(err, logs) {
      console.log("Historical events received");
      if (err) {
        console.log("Error receiving historical events:", err);
        return;
      }
      var accounts = {};
      
      logs.forEach(function(log) {
        if (log.event === "Transfer") {
          accounts[log.args._from] = log.args._from;
          accounts[log.args._to] = log.args._to;
        }
        
        if (log.event === "Approval") {
          accounts[log.args._owner] = log.args._owner;
          accounts[log.args._spender] = log.args._spender;
        }
      });
          
      async.eachSeries(logs, self.processLog, function(err) {
        console.log("All historical logs processed");
        self.exportBatchAccounts(accounts, function() {
          console.log("Export batch accounts finish");
          if (callback) callback();
        });
      });
    });
  }

  self.saveState = function(callback) {
    self.db.collection(config.tableStateName).update({ _id: self.state._id }, self.state, { upsert: true }, function(err, newLogs) {
      if (err) {
        if (err.message.indexOf("unique") !== -1) {
          console.log(log._id, "already exported!");
        } else {
          console.log("Error inserting state:", err);
        }
      }

      if (callback) callback();
    });
  };
  
  self.exportBatchAccounts = function(accounts, cb) {
    async.eachSeries(accounts, function(item, callback) {
      self.exportBalance(item, callback);
    }, function(err) {
      console.log("All historical balances updated");
      if(cb) cb();
    });
  }
  
  self.processLog = function(log, callback) {
    log._id = log.blockNumber + "_" + log.transactionIndex + "_" + log.logIndex;
    
    console.log("Exporting log:", log._id/*, "\nlog:", log*/);
    
    self.web3.eth.getBlock(log.blockNumber, false, function(err, block) {
      if (err) {
        console.log("Error retrieving block information for log:", err);
        if (callback) callback();
        return;
      }
      
      log.timestamp = block.timestamp;
      
      if (log.args && log.args._value) {
        log.args._value = log.args._value.toNumber();
      }
      
      async.waterfall([
        function(callback) {
          self.exportBlanceRecord(log.args._from, log.args._to, log.timestamp, log.args._value, function () {
            callback(null);
          });
        },
        function(callback) {
          self.db.collection(config.tableTxName).update({ _id: log._id }, log, { upsert: true }, function(err, newLogs) {
            if (err) {
              if (err.message.indexOf("unique") !== -1) {
                console.log(log._id, "already exported!");
              } else {
                console.log("Error inserting log:", err);
              }
            }
            callback(null);
          });
        }
      ], function (err, result) {
        if (err) {
          console.log(err);
        }

        console.log("Waterfall2 end");
        if (callback) callback();
      });
    });
  }
  
  self.exportBalance = function(address, callback) {

    if (callback)
      callback();

    // console.log("Exporting balance of", address);
    // self.contract.balanceOf(address, function(err, balance) {
    //   var doc = { _id: address, balance: balance.toNumber() };
    //   self.db.collection(config.tableBlanceName).update({ _id: doc._id }, doc, { upsert: true }, function(err, numReplaced) {
    //     if (err) {
    //       console.log("Error updating balance:", err);
    //     } else {
    //       console.log("Balance export completed");
    //     }
        
    //     if (callback)
    //       callback(doc.balance);
    //   });
    // });
  }

  self.exportBlanceRecord = function(from, to, timestamp, value, cb) {
    console.log("Exporting balance record from:", from, " to:", to, " value:", value);

    async.parallel([
      function(callback) {
        if (!from) {
          if (callback) callback();
          return;
        }

        self.caculateBalance(from, timestamp, -1*value, function() {
          if (callback) callback();
        });
        // self.contract.balanceOf(from, function(err, balance) {
        //   if (err) {
        //     console.log("Export balance:", err);
        //     if (callback) callback();
        //     return;
        //   }

        //   var doc = { account: from, value: -1*value, balance: balance.toNumber(), timestamp: timestamp };
        //   self.db.collection(config.tableRecordName).insert(doc, function(err, newDoc) {
        //     if (err) {
        //       console.log("Error inserting balance record:", err);
        //     }

        //     if (callback) callback();
        //   });
        // });
      },
      function(callback) {
        if (!to) {
          if (callback) callback();
          return;
        }

        self.caculateBalance(to, timestamp, value, function() {
          if (callback) callback();
        });
        // self.contract.balanceOf(to, function(err, balance) {
        //   if (err) {
        //     console.log("Export balance:", err);
        //     if (callback) callback();
        //     return;
        //   }

        //   var doc = { account: to, value: value, balance: balance.toNumber(), timestamp: timestamp };
        //   self.db.collection(config.tableRecordName).insert(doc, function(err, newDoc) {
        //     if (err) {
        //       console.log("Error inserting balance record:", err);
        //     }

        //     if (callback) callback();
        //   });
        // });
      }
    ],
    function(err, results) {
      console.log("Save all balance record processed");
      if (cb) cb();
    });
  }

  self.caculateBalance = function (address, timestamp, value, cb) {
    async.waterfall([
      function(callback) {
        self.db.collection(config.tableBlanceName).find({ _id: address }).toArray(function(err, result) {
          if (err || result.length <= 0) {
            callback(null, 0);
            return;
          }

          callback(null, result[0].balance);
        });
      },
      function(balance, callback) {
        var result = balance + value;
        var doc = { account: address, value: -1*value, balance: result, timestamp: timestamp };
        self.db.collection(config.tableRecordName).insert(doc, function(err, newDoc) {
          if (err) {
            console.log("Error inserting balance record:", err);
          }

          callback(null, result);
        });
      },
      function(balance, callback) {
        console.log("Save to collection balance, address:", address);

        var doc = { _id: address, balance: balance };
        self.db.collection(config.tableBlanceName).update({ _id: address }, doc, { upsert: true }, function(err, numReplaced) {
          if (err) {
            console.log("Error updating balance:", err);
          } else {
            console.log("Balance export completed");
          }
          
          callback(null, balance);
        });
      }
    ], function (err, result) {
      console.log("Caculate balance processed, address:", address);
      if (cb) cb();
    });
  }
  
  console.log("Exporter initialized, waiting for historical events...");
}

module.exports = exporter;