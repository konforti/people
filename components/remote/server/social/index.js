'use strict';
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

/**
 * registerOauth().
 * @param req
 * @param res
 * @param next
 */
exports.registerOauth = function (req, res, next) {
  var social = req.params.social;
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate(social, {callbackURL: '/remote/register/' + social + '/callback/'}, function (err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      workflow.outcome.errfor.username = 'No info';
      return workflow.emit('response');
    }

    if (social === 'tumblr' && !info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    var cond = {};
    cond[social + ".id"] = info.profile.id;
    req.app.db.models.User.findOne(cond, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.profile_image_url || info.profile._json.avatar_url || info.profile._json.image ? info.profile._json.image.url + '?sz=100' : '';
      workflow.profile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          var settings = req.app.getSettings();
          var payload = {
            emails: info.profile.emails,
            displayName: info.profile.displayName,
            username: info.profile.username,
            id: info.profile.id,
            provider: info.profile.provider

          };
          var token = jwt.sign(payload, settings.cryptoKey);
          res.cookie('need.mail', token);
          res.render('./need-mail', {email: ''});
        }
        else {
          registerSocial(req, res, info.profile);
        }
      }
      else {
        // Login.
        workflow.user = user;
        loginSocial(req, res, workflow);
      }
    });
  })(req, res, next);
};

exports.registerSocial = function (req, res, next) {
  if (req.cookies && req.cookies['need.mail']) {
    var settings = req.app.getSettings();
    var token = req.cookies['need.mail'];
    jwt.verify(token, settings.cryptoKey, function(err, decoded) {
      decoded.email = req.body.email;
      registerSocial(req, res, decoded);
    });
  }
};

/**
 * registerSocial().
 * @type {Function}
 */
var registerSocial = function (req, res, profile) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.email = '';
  if (profile && profile.emails && profile.emails[0].value) {
    workflow.email = profile.emails[0].value;
  }
  else {
    workflow.email = req.body.email;
  }

  workflow.on('validate', function () {
    if (req.body.email) {
      if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(workflow.email)) {
        workflow.outcome.errfor.email = 'invalid email format';
      }
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function () {
    workflow.username = profile.displayName ||  profile.username || profile.id;
    if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
      workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
    }

    req.app.db.models.User.findOne({username: workflow.username}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.username = workflow.username + profile.id;
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function () {
    req.app.db.models.User.findOne({email: workflow.email.toLowerCase()}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function () {
    var fieldsToSet = {
      mode: 'on',
      isVerified: 'yes',
      username: workflow.username,
      email: workflow.email.toLowerCase(),
      search: [
        workflow.username,
        workflow.email
      ]
    };
    fieldsToSet[profile.provider] = {id: profile.id};

    req.app.db.models.User.create(fieldsToSet, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      req.hooks.emit('userCreate', user);
      workflow.user = user;
      workflow.emit('sendWelcomeEmail');
    });
  });

  workflow.on('sendWelcomeEmail', function () {
    var settings = req.app.getSettings();
    req.app.utility.sendmail(req, res, {
      from: settings.smtpFromName + ' <' + settings.smtpFromAddress + '>',
      to: workflow.email,
      subject: 'Your ' + settings.projectName + ' Account',
      textPath: 'remote/server/register/email-text',
      htmlPath: 'remote/server/register/email-html',
      markdownPath: 'components/remote/server/register/email-markdown',
      locals: {
        username: workflow.username,
        email: workflow.email,
        projectName: settings.projectName
      },
      success: function (message) {
        workflow.emit('logUserIn');
      },
      error: function (err) {
        console.log('Error Sending Welcome Email: ' + err);
        workflow.emit('logUserIn');
      }
    });

  });

  workflow.on('logUserIn', function () {
    loginSocial(req, res, workflow);
  });

  workflow.emit('validate');
};

/**
 * loginSocial().
 * @param req
 * @param res
 * @param next
 */
var loginSocial = function (req, res, workflow) {
  req.login(workflow.user, {session: false}, function (err) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.user.avatar = '';
    if (workflow.avatar) {
      workflow.user.avatar = workflow.avatar;
    }
    else {
      var gravatarHash = crypto.createHash('md5').update(workflow.user.email).digest('hex');
      workflow.user.avatar = 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g';
    }

    var settings = req.app.getSettings();
    workflow.outcome.success = !workflow.hasErrors();
    var methods = req.app.utility.methods;
    workflow.outcome.jwt = methods.setJwt(workflow.user, settings.cryptoKey);

    methods.setSession(req, workflow.outcome.jwt, function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }

      req.hooks.emit('userLogin', workflow.user);
      if (!req.body.email) {
        res.render('remote/server/social/success', {data: JSON.stringify(workflow.outcome)});
      }
      else {
        workflow.emit('response');
      }
    });
  });
};