'use strict';

var getSocials = function(req) {
  var settings = req.app.getSettings();
  var ret = [];
  req.app.config.socials.forEach(function(social, index, arr) {
    if (!!settings[social + 'Key']) {
      ret.push(social);
    }
  });

  return ret;
};

exports.init = function (req, res) {console.log('dasd');
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('web/server/login/index', {socials: getSocials(req)});
  }
};

exports.login = function (req, res) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('abuseFilter');
  });

  workflow.on('abuseFilter', function () {
    var getIpCount = function (done) {
      var conditions = {ip: req.ip};
      req.app.db.models.LoginAttempt.count(conditions, function (err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var getIpUserCount = function (done) {
      var conditions = {ip: req.ip, user: req.body.username};
      req.app.db.models.LoginAttempt.count(conditions, function (err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var settings = req.app.getSettings();
      if (results.ip >= settings.loginAttemptsForIp || results.ipUser >= settings.loginAttemptsForIpAndUser) {
        workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
        return workflow.emit('response');
      }
      else {
        workflow.emit('attemptLogin');
      }
    };

    require('async').parallel({ip: getIpCount, ipUser: getIpUserCount}, asyncFinally);
  });

  workflow.on('attemptLogin', function () {
    req._passport.instance.authenticate('local', function (err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        var fieldsToSet = {ip: req.ip, user: req.body.username};
        req.app.db.models.LoginAttempt.create(fieldsToSet, function (err, doc) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
          return workflow.emit('response');
        });
      }
      else {
        req.login(user, {session: false}, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          var settings = req.app.getSettings();
          var methods = req.app.utility.methods;
          var token = methods.setJwt(user, settings.cryptoKey);

          methods.setSession(req, token, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }

            req.hooks.emit('userLogin', user);
            res.cookie(req.app.locals.webJwtName, token);
            workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
            workflow.emit('response');
          });
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

exports.twostep = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.body.code) {
      workflow.outcome.errfor.code = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('verifyCode');
  });

  workflow.on('verifyCode', function () {
    if (!req.twostepUser) {
      return next('No 2 step User.');
    }

    req.app.db.models.User.findById(req.twostepUser, function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next('No User.');
      }

      var notp = require('notp');
      var verify = notp.totp.verify(req.body.code, user.totp);
      if (!verify) {
        return workflow.emit('exception', 'Token invalid');
      }
      if (verify.delta > 5) {
        workflow.outcome.errors.push('Code not verified.');
        return workflow.emit('response');
      }

      req.login(user, {session: false}, function (err) {
        if (err) {
          return workflow.emit('exception', err);
        }

        var settings = req.app.getSettings();
        var gravatarHash = crypto.createHash('md5').update(user.email).digest('hex');
        user.avatar = 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g';
        user.twostep = 'verified';
        var methods = req.app.utility.methods;
        workflow.outcome.jwt = methods.setJwt(user, settings.cryptoKey);

        methods.setSession(req, workflow.outcome.jwt, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          req.hooks.emit('userLogin', user);
          workflow.emit('response');
        });
      });
    });

  });

  workflow.emit('validate');
};