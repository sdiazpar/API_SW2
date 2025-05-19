var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var sightingsRouter = require('./routes/sightings');
var peopleRouter = require('./routes/people');
var locationRouter = require('./routes/location');

var app = express();

function validateApiKey(req, res, next) {
  // x-api-key en el header 
  const apiKey = req.header('x-api-key') || req.query.api_key;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key requerida' });
  }
  if (apiKey !== "abcd1234") {
    return res.status(403).json({ error: 'API key inválida' });
  }
  req.apiKey = apiKey;
  next();
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/sightings',validateApiKey ,sightingsRouter);
app.use('/people', validateApiKey ,peopleRouter);
app.use('/location', validateApiKey,locationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
