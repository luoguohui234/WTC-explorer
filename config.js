var web3 = require('web3');
var net = require('net');


var config = function () {
  
  this.logFormat = "combined";

  this.ipcPath = process.env["HOME"] + "/.ethereum/geth.ipc";
  this.provider = new web3.providers.IpcProvider(this.ipcPath, net);

  //this.provider = new web3.providers.HttpProvider("http://172.35.3.227:9999");
  
  this.bootstrapUrl = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/yeti/bootstrap.min.css";
  
  this.erc20ABI = [{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"totalSupply","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];

  this.tokenShortName = "WTC";
  this.tokenAddress = "0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74";
  this.tokenDecimals = 18;
  this.tokenName = "Token Walton";
  this.tokenDescription = "Token Walton";
  this.tokenTotalSupply = 70000000;
  this.initApplyAddress = "0x309a272885bdea62d99c4e32e40bee93a3ccef6a";
    
  this.exportStartBlock = 0; // Start block for the historic export (set to 0 for a full export)
  
  this.dbName = "wtc"; // db name
  this.tableStateName = "state"; // save app state
  this.tableTxName = "tx"; // save event record
  this.tableBlanceName = "balance"; // save account balance
  this.tableRecordName = "record"; // save account blance records

  this.analysisStep = 1000;
  this.analysisStepMax = 5100000;

  this.names = {
    "0x0536806df512d6cdde913cf95c9886f65b1d3462": "Example Name"
  }
}

module.exports = config;