'use strict';

exports.init = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    req.app.db.models.User.findOne().exec(function (err, record) {
      if (err) {
        return next(err);
      }

      if (record) {
        return res.redirect('/');
      }
      else {
        workflow.emit('render');
      }
    });
  });

  workflow.on('render', function () {
    res.render('web/server/install/index');
  });

  workflow.emit('validate');
};

exports.install = function (req, res) {
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

    workflow.emit('createUser');
  });

  workflow.on('createRole', function () {
    req.app.db.models.Role.create({_id: 'root', name: 'Root'}, function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
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
        roles: ['root'],
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
        workflow.emit('logUserIn');
      });
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
          var methods = req.app.utility.methods;
          var token = methods.setJwt(workflow.user, settings.cryptoKey);

          methods.setSession(req, token, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }

            res.cookie(req.app.locals.webJwtName, token);
            workflow.emit('response');
          });
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};
