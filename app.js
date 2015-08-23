'use strict';

// Dependencies.
var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    serveStatic = require('serve-static'),
    helmet = require('helmet');

// Create express app.
var app = express();

// Setup the web server.
app.server = http.createServer(app);

// Keep reference to config.
try {
  app.config = require('./config');
}
catch(e) {
  console.error('\x1b[31m', 'config.js file is missing.\nPlease copy config.example.js to config.js');
  return process.exit(1);
}

// Settings.
app.getSettings = function() {
  try {
    return JSON.parse(fs.readFileSync('./settings.json', {encoding: 'utf8'}));
  }
  catch(e) {
    var defaults = JSON.parse(fs.readFileSync('./defaults.json', {encoding: 'utf8'}));
    defaults.cryptoKey = crypto.randomBytes(6).toString('hex');
    fs.writeFileSync('./settings.json', JSON.stringify(defaults, null, '\t'));
    return JSON.parse(fs.readFileSync('./settings.json', {encoding: 'utf8'}));
  }
};

// Set cryptoKey if there is none.
app.appSettings = app.getSettings();

// Setup mongoose.
app.db = mongoose.createConnection(app.config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  // and... we have a data store
});

// Config data models.
require('./schema/models')(app, mongoose);

// Settings.
app.disable('x-powered-by');
app.set('port', app.config.port);
app.set('views', path.join(__dirname, 'components'));
app.set('view engine', 'jade');

// Middleware.
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(serveStatic(path.join(__dirname, 'public'), {
  setHeaders: function(res, path) {
    if (app.appSettings.allowDomains.indexOf(res.req.headers.origin) > -1) {
      res.setHeader("Access-Control-Allow-Origin", res.req.headers.origin);
    }
  }
}));
app.use(function(req, res, next) {
  if (req.headers.authorization || req.method === 'OPTIONS') {
    return next();
  }
  else {
    return session({
      resave: false,
      saveUninitialized: false,
      secret: app.appSettings.cryptoKey,
      store: new mongoStore({url: 'mongodb://' + app.config.mongodb.uri, ttl: 60*60})
    })(req, res, next);
  }
});
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(app.appSettings.cryptoKey));
app.use(passport.initialize());
app.use(helmet());

// Global locals.
app.locals.projectName = app.appSettings.projectName;
app.locals.copyrightName = app.appSettings.projectName;
app.locals.webJwtName = 'people.token';
app.locals.remoteJwtName = 'people.jwt';
app.locals.copyrightYear = new Date().getFullYear();
app.locals.cacheBreaker = 'br34k-01';

// CORS middleware.
app.use(function(req, res, next) {
  if(app.appSettings.allowDomains.indexOf(req.headers.origin) > -1){
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Authentication middleware
app.use(require('./util/auth')());

// Response locals.
app.use(function(req, res, next) {
  res.locals.user = {
    defaultReturnUrl: req.user && req.user.defaultReturnUrl(),
    username: req.user && req.user.username
  };
  next();
});

// Hooks middleware.
app.use(require('./util/hooks')());

// Rules middleware.
app.use(require('./rules')());

// Setup passport.
require('./util/passport')(app, passport);

// Setup routes.
require('./components/api/routes')(app);
require('./components/remote/server/routes')(app, passport);
require('./components/web/server/routes')(app, passport);

// Custom (friendly) error handler.
app.use(require('./components/web/server/http/index').http500);

// Setup utilities.
app.utility = {
  sendmail: require('./util/sendmail'),
  slugify: require('./util/slugify'),
  workflow: require('./util/workflow'),
  methods: require('./util/methods')
};

// Listen up.
app.server.listen(app.config.port, app.config.ip, function() {
  //and... we're live
});