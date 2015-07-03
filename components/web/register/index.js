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

exports.init = function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('register/index', {socials: getSocials(req)});
  }
};

exports.register = function (req, res) {
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

      var fieldsToSet = {
        mode: 'on',
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

        workflow.user = user;
        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function () {
    var settings = req.app.getSettings();
    req.app.utility.sendmail(req, res, {
      from: settings.smtpFromName + ' <' + settings.smtpFromAddress + '>',
      to: req.body.email,
      subject: 'Your ' + settings.projectName + ' Account',
      textPath: 'register/email-text',
      htmlPath: 'register/email-html',
      locals: {
        username: req.body.username,
        email: req.body.email,
        loginURL: req.protocol + '://' + req.headers.host + '/login/',
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
    req._passport.instance.authenticate('local', function (err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
        return workflow.emit('response');
      }
      else {
        req.login(user, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};