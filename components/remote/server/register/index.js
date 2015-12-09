'use strict';
var crypto = require('crypto');

/**
 *
 * @param req
 * @param res
 */
exports.info = function (req, res) {
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('validate', function () {
    workflow.emit('getInfo');
  });

  workflow.on('getInfo', function () {
    var actives = [];
    var settings = req.app.getSettings();
    req.app.config.socials.forEach(function(social, index, arr) {
      if (settings[social + 'Key']) {
        actives.push(social);
      }
    });

    workflow.outcome.info = {
      appName: settings.projectName,
      appEmail: settings.systemEmail,
      sessionExp: settings.sessionExp,
      socials: actives
    };

    workflow.emit('response');
  });

  workflow.emit('validate');
};

/**
 *
 * @param req
 * @param res
 */
exports.register = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
    }

    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function () {
    req.app.db.models.User.findOne({username: req.body.username}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function () {
    req.app.db.models.User.findOne({email: req.body.email.toLowerCase()}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function () {
    req.app.db.models.User.encryptPassword(req.body.password, function (err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      crypto.randomBytes(21, function (err, buf) {
        if (err) {
          return next(err);
        }

        // Verification Token.
        var token = buf.toString('hex');
        req.app.db.models.User.encryptPassword(token, function (err, verificationHash) {
          if (err) {
            return next(err);
          }

          var fieldsToSet = {
            mode: 'on',
            isVerified: 'no',
            verificationToken: verificationHash,
            username: req.body.username,
            email: req.body.email.toLowerCase(),
            password: hash,
            search: [
              req.body.username,
              req.body.email
            ]
          };
          req.app.db.models.User.create(fieldsToSet, function (err, user) {
            if (err) {
              return workflow.emit('exception', err);
            }

            req.hooks.emit('userCreate', user);
            workflow.user = user;
            workflow.emit('sendWelcomeEmail', token);
          });
        });
      });
    });
  });

  workflow.on('sendWelcomeEmail', function (token) {
    var settings = req.app.getSettings();
    req.app.utility.sendmail(req, res, {
      from: settings.smtpFromName + ' <' + settings.smtpFromAddress + '>',
      to: req.body.email.toLowerCase(),
      subject: 'Welcome to ' + settings.projectName,
      textPath: 'remote/server/register/email-text',
      htmlPath: 'remote/server/register/email-html',
      markdownPath: 'components/remote/server/register/email-markdown',
      locals: {
        username: req.body.username,
        verifyURL: req.protocol + '://' + req.headers.host + '/remote/verify/' + token + '/',
        projectName: settings.projectName
      },
      success: function () {
        workflow.emit('logUserIn');
      },
      error: function (err) {
        console.error('Error Sending Welcome Email: ' + err);
        workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function () {
    req._passport.instance.authenticate('local', function (err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
        return workflow.emit('response');
      }
      else {
        req.login(user, {session: false}, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          var settings = req.app.getSettings();
          var gravatarHash = crypto.createHash('md5').update(req.body.email).digest('hex');
          user.avatar = 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g';
          user.twostep = 'off';
          var methods = req.app.utility.methods;
          workflow.outcome.jwt = methods.setJwt(user, settings.cryptoKey);

          methods.setSession(req, res, workflow.outcome.jwt, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }

            req.hooks.emit('userLogin', user);
            workflow.emit('response');
          });
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

/**
 * login.
 * @param req
 * @param res
 */
exports.login = function (req, res, next) {
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
    var settings = req.app.getSettings();
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
      else if (typeof user.totp !== 'undefined' && user.totp.length > 0) {
        var payload = {
          id: user.id,
          twostep: 'on'
        };
        var jwt = require('jsonwebtoken');
        workflow.outcome.jwt = jwt.sign(payload, settings.cryptoKey);
        workflow.emit('response');
      }
      else {
        req.login(user, {session: false}, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          var gravatarHash = crypto.createHash('md5').update(user.email).digest('hex');
          user.avatar = 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g';
          user.twostep = 'off';
          var methods = req.app.utility.methods;
          workflow.outcome.jwt = methods.setJwt(user, settings.cryptoKey);

          methods.setSession(req, res, workflow.outcome.jwt, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }

            req.hooks.emit('userLogin', user);
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

        methods.setSession(req, res, workflow.outcome.jwt, function(err) {
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