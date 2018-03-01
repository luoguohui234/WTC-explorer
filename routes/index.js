var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var db = req.app.get('db');
  var config = req.app.get('config');
  
  db.collection(config.tableTxName).find({}).sort({ timestamp: -1 }).limit(10).toArray(function (err, events) {    
    res.render('index', { events: events });
  });

});

module.exports = router;
