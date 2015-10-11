'use strict';

var jwt = require('jsonwebtoken');

exports.init = function (req, res) {
  res.render('web/server/login/twostep/index');
};

exports.twostep = function (req, res, next) {
  var settings = req.app.getSettings();
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

    workflow.emit('login');
  });

  workflow.on('login', function () {
    req.app.db.models.User.findById(req.twostepUser, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }
      if (!user) {
        return workflow.emit('exception', 'No User');
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

        var methods = req.app.utility.methods;
        var token = methods.setJwt(user, settings.cryptoKey);

        methods.setSession(req, res, token, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          req.hooks.emit('userLogin', user);
          res.cookie(req.app.locals.webJwtName, token);
          workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
          workflow.emit('response');
        });
      });
    });
  });

  workflow.emit('validate');
};