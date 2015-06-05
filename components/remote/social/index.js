'use strict';
var crypto = require('crypto');
var signature = require('cookie-signature');

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupFacebook = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('facebook', {callbackURL: '/remote/signup/facebook/callback/'}, function (err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      workflow.outcome.errfor.username = 'No info';
      return workflow.emit('response');
    }

    req.app.db.models.User.findOne({'facebook.id': info.profile.id}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = '//graph.facebook.com/' + info.profile.id + '/picture?height=100&width=100';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
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

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupTwitter = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('twitter', {callbackURL: '/remote/signup/twitter/callback/'}, function (err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      workflow.outcome.errfor.username = 'No info';
      return workflow.emit('response');
    }

    req.app.db.models.User.findOne({'twitter.id': info.profile.id}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.profile_image_url;
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
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

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupGitHub = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('github', {callbackURL: '/remote/signup/github/callback/'}, function (err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      workflow.outcome.errfor.username = 'No info';
      return workflow.emit('response');
    }

    req.app.db.models.User.findOne({'github.id': info.profile.id}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.avatar_url;
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
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

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupGoogle = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('google', {callbackURL: '/remote/signup/google/callback/'}, function (err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      workflow.outcome.errfor.username = 'No info';
      return workflow.emit('response');
    }

    req.app.db.models.User.findOne({'google.id': info.profile.id}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.image.url + '?sz=100';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
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

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupTumblr = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('tumblr', {callbackURL: '/remote/signup/tumblr/callback/'}, function (err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      workflow.outcome.errfor.username = 'No info';
      return workflow.emit('response');
    }

    req.app.db.models.User.findOne({'tumblr.id': info.profile.id}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      //info.profile.avatar = info.profile._json.image.url + '?sz=100';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
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

/**
 * signupSocial().
 * @type {Function}
 */
var signupSocial = exports.signupSocial = function (req, res, next) {
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
      mode: 'yes',
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
      textPath: '../remote/social/email-text',
      htmlPath: '../remote/social/email-html',
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

    var sid = signature.sign(req.sessionID, req.app.config.cryptoKey);

    var settings = req.app.getSettings();
    workflow.outcome.success = !workflow.hasErrors();
    workflow.outcome.allowDomain = settings.allowDomain;
    workflow.outcome.sid = sid;
    workflow.outcome.user = {
      email: workflow.user.email,
      username: workflow.user.username,
      avatar: workflow.user.avatar
    };
    delete req.session.socialProfile;

    req.hooks.emit('userLogin', workflow.outcome.user);

    if (!req.body.email) {
      res.render('../remote/social/success', {data: JSON.stringify(workflow.outcome)});
    }
    else {
      workflow.emit('response');
    }
  });
};