'use strict';
var crypto = require('crypto');
var signature = require('cookie-signature');

/**
 * Profile().
 * @param req
 * @param res
 */
exports.readProfile = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  var outcome = {};

  var getRecord = function (callback) {
    req.app.db.models.User.findById(req.user.id).exec(function (err, record) {
      if (err) {
        return next(err);
      }

      outcome.record = record;
      return callback(null, 'done');
    });
  };

  var getFields = function (callback) {
    req.app.db.models.Field.find({}, 'name').sort('name').exec(function (err, fields) {
      if (err) {
        return callback(err, null);
      }

      outcome.fields = fields;
      return callback(null, 'done');
    });
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

    // Populate fields values.
    outcome.fields.forEach(function(field, index, array) {
      field.value = '';
      for(var key in outcome.record.fields) {
        if (outcome.record.fields.hasOwnProperty(key)) {
          if (field._id === key) {
            field.value = outcome.record.fields[key];
          }
        }
      }
    });

    if (req.xhr) {
      res.send(outcome.record);
    }
    else {
      var csrfToken = crypto.pseudoRandomBytes(16).toString('hex');
      req.session.remoteToken = csrfToken;
      req.app.render('../remote/profile/index', {
        data: {
          csrfToken: csrfToken,
          record: outcome.record,
          fields: outcome.fields
        }
      }, function (err, html) {
        workflow.outcome.html = html;
        workflow.emit('response');
      });
    }
  };

  require('async').parallel([getFields, getRecord], asyncFinally);
};

/**
 * Update a user profile.
 * @param req
 * @param res
 * @param next
 */
exports.updateProfile = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {

    if (req.body.csrf !== req.session.remoteToken) {
      workflow.outcome.errfor.form = 'invalid csrf token';
    }

    var settings = req.app.getSettings();
    if (req.sessionID !== signature.unsign(req.body.sid, settings.cryptoKey)) {
      workflow.outcome.errfor.session = 'invalid session';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    req.app.db.models.User.findById(req.user.id, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = {};

      crypto.randomBytes(21, function (err, buf) {
        if (err) {
          return next(err);
        }

        var token = buf.toString('hex');
        req.app.db.models.User.encryptPassword(token, function (err, hash) {
          if (err) {
            return next(err);
          }

          if (user.email !== req.body.email.toLowerCase()) {
            fieldsToSet.isVerified = 'no';
            fieldsToSet.verificationToken = hash;
            var newEmail = true;
          }

          fieldsToSet.username = req.body.username;
          fieldsToSet.email = req.body.email.toLowerCase();
          fieldsToSet.fields = JSON.parse(req.body.fields);
          fieldsToSet.search = [
            req.body.username,
            req.body.email
          ];

          req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
            if (err) {
              return workflow.emit('exception', err);
            }

            req.hooks.emit('userUpdate', user);

            workflow.outcome.record = user;
            if (newEmail) {
              workflow.emit('sendVerificationEmail', token);
            }
            else {
              workflow.emit('getFields');
            }
          });
        });
      });
    });
  });

  workflow.on('sendVerificationEmail', function (token) {

    require('../verification').sendVerificationEmail(req, res, {
      email: req.body.email.toLowerCase(),
      verificationToken: token,
      onSuccess: function () {
        workflow.emit('patchFields');
      },
      onError: function (err) {
        console.log('Error Sending Welcome Email: ' + err);
        workflow.emit('exception', err);
        workflow.emit('getFields');
      }
    });
  });

  workflow.on('getFields', function () {
    req.app.db.models.Field.find({}, 'name').sort('name').exec(function (err, fields) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.fields = fields;
      workflow.emit('renderProfile');
    });
  });

  workflow.on('renderProfile', function () {

    // Populate fields values.
    workflow.outcome.fields.forEach(function(field, index, array) {
      field.value = '';
      for(var key in workflow.outcome.record.fields) {
        if (workflow.outcome.record.fields.hasOwnProperty(key)) {
          if (field._id === key) {
            field.value = workflow.outcome.record.fields[key];
          }
        }
      }
    });

    var csrfToken = crypto.pseudoRandomBytes(16).toString('hex');
    req.session.remoteToken = csrfToken;
    req.app.render('../remote/profile/index', {
        data: {
          csrfToken: csrfToken,
          record: workflow.outcome.record,
          fields: workflow.outcome.fields
        }
      }, function (err, html) {
        delete workflow.outcome.record;
        workflow.outcome.html = html;
        workflow.emit('response');
      }
    );
  });

  workflow.emit('validate');
};

/**
 * Update a user password.
 * @param req
 * @param res
 * @param next
 */
exports.updatePassword = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {

    if (req.body.csrf !== req.session.remoteToken) {
      workflow.outcome.errfor.form = 'invalid csrf token';
    }

    if (req.body.newPassword !== req.body.confirm) {
      workflow.outcome.errfor.password = 'password not match';
    }

    var settings = req.app.getSettings();
    if (req.sessionID !== signature.unsign(req.body.sid, settings.cryptoKey)) {
      workflow.outcome.errfor.session = 'invalid session';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    var fieldsToSet = {};
    req.app.db.models.User.encryptPassword(req.body.newPassword, function (err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      fieldsToSet.password = hash;
      req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        req.hooks.emit('userPasswordChange', user);
        workflow.outcome.record = user;
        workflow.emit('getFields');
      });
    });
  });

  workflow.on('getFields', function () {
    req.app.db.models.Field.find({}, 'name').sort('name').exec(function (err, fields) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.fields = fields;
      workflow.emit('renderProfile');
    });
  });

  workflow.on('renderProfile', function () {
    // Populate fields values.
    workflow.outcome.fields.forEach(function(field, index, array) {
      field.value = '';
      for(var key in workflow.outcome.record.fields) {
        if (workflow.outcome.record.fields.hasOwnProperty(key)) {
          if (field._id === key) {
            field.value = workflow.outcome.record.fields[key];
          }
        }
      }
    });

    var csrfToken = crypto.pseudoRandomBytes(16).toString('hex');
    req.session.remoteToken = csrfToken;
    req.app.render('../remote/profile/index', {
        data: {
          csrfToken: csrfToken,
          record: workflow.outcome.record,
          fields: workflow.outcome.fields
        }
      }, function (err, html) {
        delete workflow.outcome.record;
        workflow.outcome.html = html;
        workflow.emit('response');
      }
    );
  });

  workflow.emit('validate');
};
