'use strict';

var crypto = require('crypto');

var getHash = function(req, token) {
  var settings = req.app.getSettings();
  return crypto
    .createHmac('sha256', settings.cryptoKey)
    .update(token)
    .digest('base64');
};

exports.forgot = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('emailExistCheck');
  });

  workflow.on('emailExistCheck', function () {
    req.app.db.models.User.findOne({email: req.body.email.toLowerCase()}, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errfor.email = 'email not exist';
        return workflow.emit('response');
      }

      workflow.emit('generateToken');
    });
  });

  workflow.on('generateToken', function () {
    crypto.randomBytes(384, function (err, buf) {
      if (err) {
        return next(err);
      }
      var token = buf.toString('base64');
      var hash = getHash(req, token);
      workflow.emit('patchUser', token, hash);
    });
  });

  workflow.on('patchUser', function (token, hash) {
    var conditions = {email: req.body.email.toLowerCase()};
    var fieldsToSet = {
      resetPasswordToken: hash,
      resetPasswordExpires: Date.now() + (60 * 60 * 1000)
    };
    req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        return workflow.emit('response');
      }

      workflow.emit('sendEmail', token, user);
    });
  });

  workflow.on('sendEmail', function (token, user) {
    var settings = req.app.getSettings();
    req.app.utility.sendmail(req, res, {
      from: settings.smtpFromName + ' <' + settings.smtpFromAddress + '>',
      to: user.email,
      subject: 'Reset your ' + settings.projectName + ' password',
      textPath: 'remote/forgot/email-text',
      htmlPath: 'remote/forgot/email-html',
      markdownPath: 'components/remote/forgot/email-markdown',
      locals: {
        username: user.username,
        resetCode: token,
        projectName: settings.projectName
      },
      success: function (message) {
        return workflow.emit('response');
      },
      error: function (err) {
        workflow.outcome.errors.push('Error Sending: ' + err);
        return workflow.emit('response');
      }
    });
  });

  workflow.emit('validate');
};

exports.forgotReset = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.body.token) {
      workflow.outcome.errfor.token = 'required';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('findUser');
  });

  workflow.on('findUser', function () {
    var hash = getHash(req, req.body.token);
    var conditions = {
      resetPasswordToken: hash,
      resetPasswordExpires: {$gt: Date.now()}
    };
    req.app.db.models.User.findOne(conditions, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Invalid request.');
        return workflow.emit('response');
      }

      workflow.emit('patchUser', user);
    });
  });

  workflow.on('patchUser', function (user) {
    req.app.db.models.User.encryptPassword(req.body.password, function (err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = {password: hash, resetPasswordToken: ''};
      req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('response');
      });
    });
  });

  workflow.emit('validate');
};