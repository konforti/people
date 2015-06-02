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
    helmet = require('helmet'),
    csrf = require('csurf');

// Create express app.
var app = express();

// Keep reference to config.
app.config = config;

// Setup the web server.
app.server = http.createServer(app);

var settings = JSON.parse(fs.readFileSync(process.env.PWD + '/settings.json', {encoding: 'utf8'}));
if (!settings.cryptoKey) {
  settings.cryptoKey = crypto.randomBytes(6).toString('hex');
  fs.writeFileSync(process.env.PWD + '/settings.json', JSON.stringify(settings, null, '\t'));
}
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
app.set('views', path.join(__dirname, 'components/web'));
app.set('view engine', 'jade');

// Middleware.
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(settings.cryptoKey));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: settings.cryptoKey,
  store: new mongoStore({ url: config.mongodb.uri })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  if (req.path.indexOf('/remote/') === 0 || req.path.indexOf('/api/') === 0) {
    req.csrfToken = function() {return '';};
    next();
  }
  else {
    (csrf())(req, res, next);
  }
});
app.use(helmet());

// Response locals.
app.use(function(req, res, next) {
  res.cookie('_csrfToken', req.csrfToken());
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

// Global locals.
app.db.models.Settings.getParam('projectName', function(err, param) {
  app.locals.projectName = param;
  app.locals.copyrightName = param;
});

app.locals.copyrightYear = new Date().getFullYear();
app.locals.cacheBreaker = 'br34k-01';

// CORS middleware.
app.db.models.Settings.getParam('projectName', function(err, param) {

});
var allowCrossDomain = function(req, res, next) {
  app.db.models.Settings.getParam('allowDomain', function(err, param) {
    res.header('Access-Control-Allow-Origin', param);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
};
app.use(allowCrossDomain);

// Hooks middleware.
app.use(function(req, res, next) {
  req.hooks = require('./util/hooks')(req, res, next);
  next();
});

// Rules middleware.
app.use(function(req, res, next) {
  require('./rules')(req, res, next);
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
app.server.listen(app.config.port, app.config.ip, function(){
  //and... we're live
});