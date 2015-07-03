'use strict'

var crypto = require('crypto');

exports.registerOauth = function (req, res, next) {
  var social = req.params.social;
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate(social, {callbackURL: '/register/' + social + '/callback/'}, function (err, user, info) {
    if (err) {console.log('asdasd');
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

      info.profile.avatar = info.profile._json.profile_image_url || info.profile._json.avatar_url || info.profile._json.image.url + '?sz=100' || '';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../web/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          registerSocial(req, res, next);
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

var registerSocial = exports.registerSocial = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.email = '';
  if (req.session.socialProfile && req.session.socialProfile.emails && req.session.socialProfile.emails[0].value) {
    workflow.email = req.session.socialProfile.emails[0].value;
  }
  else {
    workflow.email = req.body.email;
  }

  workflow.on('validate', function () {
    if (req.body.email) {
      if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
        workflow.outcome.errfor.email = 'invalid email format';
      }
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function () {
    workflow.username = req.session.socialProfile.displayName ||  req.session.socialProfile.username || req.session.socialProfile.id;
    if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
      workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
    }

    req.app.db.models.User.findOne({username: workflow.username}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.username = workflow.username + req.session.socialProfile.id;
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
    fieldsToSet[req.session.socialProfile.provider] = {id: req.session.socialProfile.id};

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
      textPath: '../web/register/email-text',
      htmlPath: '../web/register/email-html',
      markdownPath: '../web/register/email-markdown',
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

var loginSocial = function (req, res, workflow) {
  req.login(workflow.user, function (err) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.user.avatar = '';
    if (req.session.socialProfile && req.session.socialProfile.avatar) {
      workflow.user.avatar = req.session.socialProfile.avatar;
    }
    else {
      var gravatarHash = crypto.createHash('md5').update(req.email).digest('hex');
      workflow.user.avatar = 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g';
    }

    workflow.outcome.success = !workflow.hasErrors();
    workflow.outcome.user = {
      email: workflow.user.email,
      username: workflow.user.username,
      avatar: workflow.user.avatar
    };
    delete req.session.socialProfile;

    req.hooks.emit('userLogin', workflow.outcome.user);

    if (!req.body.email) {
      res.render('../web/social/success', {data: JSON.stringify(workflow.outcome)});
    }
    else {
      workflow.emit('response');
    }
  });
};
