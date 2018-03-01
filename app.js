var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var account = require('./routes/account');
var accounts = require('./routes/accounts');
var event = require('./routes/event');
var events = require('./routes/events');
var search = require('./routes/search');

var config = new(require('./config.js'))();
//var Datastore = require('nedb-core')
//var db = new Datastore({ filename: './data.db', autoload: true });

var mongo = require("mongodb");
var assert = require("assert");

var app = express();

mongo.MongoClient.connect("mongodb://localhost:27017/", function(err, result) {
  assert.equal(null, err);

  console.log("Connect to mongodb success");
  db = result.db(config.dbName);

  db.collection(config.tableBlanceName).ensureIndex({ 'balance' : 1 }, { "unique" : false }, function (err) {
    if (err) {
      console.log("Error creating balance db index:", err);
    }
    console.log("Collection ensureIndex balance");
  });


  db.collection(config.tableTxName).ensureIndex({ 'timestamp' : -1 }, { "unique" : false }, function (err) {
    if (err) {
      console.log("Error creating timestamp db index:", err);
    }
    console.log("Collection ensureIndex timestamp");
  });

  db.collection(config.tableTxName).ensureIndex('args._from', { "unique" : false }, function (err) {
    if (err) {
      console.log("Error creating _from db index:", err);
    }
    console.log("Collection ensureIndex _from");
  });

  db.collection(config.tableTxName).ensureIndex('args._to', { "unique" : false }, function (err) {
    if (err) {
      console.log("Error creating _to db index:", err);
    }
    console.log("Collection ensureIndex _to");
  });

  db.collection(config.tableRecordName).ensureIndex('account', { "unique" : false }, function (err) {
    if (err) {
      console.log("Error creating account db index:", err);
    }
    console.log("Collection ensureIndex account");
  });

  var exporterService = require('./services/exporter.js');
  var exporter = new exporterService(config, db);

  app.set('db', db);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('config', config);

app.set('trust proxy', true);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(config.logFormat));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/account', account);
app.use('/accounts', accounts);
app.use('/event', event);
app.use('/events', events);
app.use('/search', search);

app.locals.moment = require('moment');
app.locals.nodeStatus = new(require('./utils/nodeStatus.js'))(config);
app.locals.nameformatter = new(require('./utils/nameformatter.js'))(config);
app.locals.tokenformatter = new(require('./utils/tokenformatter.js'))(config);
app.locals.config = config;

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
