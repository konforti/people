'use strict';

// Dependencies.
var config = require('./config'),
    express = require('express'),
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

// Keep reference to config.
app.config = config;

// Setup the web server.
app.server = http.createServer(app);

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
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  // and... we have a data store
});

// Config data models.
require('./schema/models')(app, mongoose);

// Settings.
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'components'));
app.set('view engine', 'jade');

// Middleware.
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(serveStatic(path.join(__dirname, 'components/remote/public'), {
  setHeaders: function(res, path) {
    if (app.appSettings.allowDomains.indexOf(res.req.headers.origin) > -1) {
      res.setHeader("Access-Control-Allow-Origin", res.req.headers.origin);
    }
  }
}));
app.use(serveStatic(path.join(__dirname, 'components/web/public')));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: app.appSettings.cryptoKey,
  store: new mongoStore({ url: config.mongodb.uri })
}));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(app.appSettings.cryptoKey));
app.use(passport.initialize());
app.use(helmet());

// Response locals.
app.use(function(req, res, next) {
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Hooks middleware.
app.use(function(req, res, next) {
  req.hooks = require('./util/hooks')(req, res, next);
  next();
});

// Rules middleware.
app.use(function(req, res, next) {
  require('./rules/rules')(req, res, next);
  next();
});

// Setup passport.
require('./util/passport')(app, passport);

// Setup routes.
require('./components/api/routes')(app);
require('./components/remote/routes')(app, passport);
require('./components/web/routes')(app, passport);

// Custom (friendly) error handler.
app.use(require('./components/web/http/index').http500);

// Setup utilities.
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

// Listen up.
app.server.listen(app.config.port, app.config.ip, function() {
  //and... we're live
});