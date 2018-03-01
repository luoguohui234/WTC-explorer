var express = require('express');
var router = express.Router();

router.get('/:offset?', function(req, res, next) {
  var db = req.app.get('db');
  var config = req.app.get('config');
  
  if (!req.params.offset) {
    req.params.offset = 0;
  } else {
    req.params.offset = parseInt(req.params.offset);
  }

  db.collection(config.tableTxName).find({}).sort({ timestamp: -1 }).skip(req.params.offset).limit(50).toArray(function(err, events) {
    res.render('events', {events: events, offset: req.params.offset, stepSize: 50 });
  });

});

module.exports = router;
