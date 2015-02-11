'use strict';

var crypto = require('crypto');

exports.sendVerificationEmail = function (req, res, options) {
  req.app.utility.sendmail(req, res, {
    from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
    to: options.email,
    subject: 'Verify Your ' + req.app.config.projectName + ' Account',
    textPath: '../remote/verification/email-text',
    htmlPath: '../remote/verification/email-html',
    locals: {
      verifyURL: req.protocol + '://' + req.headers.host + '/remote/verification/' + options.verificationToken + '/',
      projectName: req.app.config.projectName
    },
    success: function () {
      options.onSuccess();
    },
    error: function (err) {
      options.onError(err);
    }
  });
};

exports.verification = function (req, res, next) {
  if (req.user.isVerified === 'yes') {
    return res.redirect(req.app.config.defaultReturnUrl);
  }
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('validate', function () {
    workflow.emit('generateToken');
  });

  workflow.on('generateToken', function () {
    crypto.randomBytes(21, function (err, buf) {
      if (err) {
        return next(err);
      }
      var token = buf.toString('hex');
      req.app.db.models.User.encryptPassword(token, function (err, hash) {
        if (err) {
          return next(err);
        }
        workflow.emit('patchUser', token, hash);
      });
    });
  });

  workflow.on('patchUser', function (token, hash) {
    var fieldsToSet = {verificationToken: hash};
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      exports.sendVerificationEmail(req, res, {
        email: user.email,
        verificationToken: token,
        onSuccess: function () {
          workflow.emit('response');
        },
        onError: function (err) {
          workflow.outcome.errors.push('Error Sending: ' + err);
          workflow.emit('response');
        }
      });
    });
  });

  workflow.emit('validate');
};

exports.verify = function (req, res, next) {
  req.app.db.models.User.validatePassword(req.params.token, req.user.verificationToken, function (err, isValid) {
    if (err) {
      return next(err);
    }

    if (!isValid) {
      return res.send('This URL isn\'t valid');
    }

    var fieldsToSet = {isVerified: 'yes', verificationToken: ''};
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {

      return res.redirect(req.app.config.defaultReturnUrl + '?verified=true');
    });
  });
};
