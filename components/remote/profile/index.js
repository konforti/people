'use strict';
var crypto = require('crypto');
var signature = require('cookie-signature');

/**
 * Profile().
 * @param req
 * @param res
 */
exports.readProfile = function (req, res, next) {
  var outcome = {};
  var getRecord = function (callback) {
    req.app.db.models.User.findById(req.user.id).exec(function (err, record) {
      if (err) {
        return callback(err);
      }
      outcome.record = record;
      return callback(null, 'done');
    });
  };

  var getUserFields = function (callback) {
    req.app.db.models.UserMeta.find({user: req.user.id}).exec(function (err, fields) {
      if (err) {
        return callback(err, null);
      }

      req.app.db.models.Field.getAll(function(err, list) {
        outcome.fields = {};
        for (var i = 0; i < list.length; i++) {
          outcome.fields[list[i]._id] = {name: list[i].name, value: ''};
          for (var j = 0; j < fields.length; j++) {
            if (fields[j].key === list[i]._id) {
              outcome.fields[list[i]._id].value = typeof fields[j] !== 'undefined' ? fields[j].value : '';
            }
          }
        }
        return callback(null, 'done');
      });
    });
  };

  var asyncFinally = function (err, results) {
    var workflow = req.app.utility.workflow(req, res);
    if (err) {
      return workflow.emit('exception', err);
    }

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
  };

  require('async').parallel([getRecord, getUserFields], asyncFinally);
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

    if (req.sessionID !== signature.unsign(req.body.sid, req.app.config.cryptoKey)) {
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

          req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
            if (err) {
              return workflow.emit('exception', err);
            }

            workflow.outcome.record = user;
            if (newEmail) {
              workflow.emit('sendVerificationEmail', token);
            }
            else {
              workflow.emit('patchFields');
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
        workflow.emit('patchFields');
      }
    });
  });

  workflow.on('patchFields', function () {
    workflow.outcome.fields = {};
    req.app.db.models.Field.getAll(function(err, fields) {
      for (var i = 0; i < fields.length; i++) {
        var extraFieldsToSet = {};
        extraFieldsToSet.key = fields[i]._id;
        extraFieldsToSet.value = req.body[fields[i]._id];

        (function(i) {
          req.app.db.models.UserMeta.findOneAndUpdate({
            user: req.user.id,
            key: fields[i]._id
          }, extraFieldsToSet, {upsert: true}, function (err, userField) {
            if (err) {
              return workflow.emit('exception', err);
            }

            fields[i].value = userField.value;
            workflow.outcome.fields[userField.key] = {name: fields[i].name, value: userField.value};

            if (i >= fields.length - 1) {
              workflow.emit('renderProfile');
            }
          });
        })(i);
      }
    });
  });

  workflow.on('renderProfile', function () {
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
        delete workflow.outcome.fields;
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

    if (req.sessionID !== signature.unsign(req.body.sid, req.app.config.cryptoKey)) {
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

        workflow.outcome.record = user;
        workflow.emit('patchFields');
      });
    });
  });

  workflow.on('patchFields', function () {
    workflow.outcome.fields = [];
    req.app.db.models.Field.getAll(function(err, fields) {
      for (var i = 0; i < fields.length; i++) {
        (function(i) {
          req.app.db.models.UserMeta.findOne({user: req.user.id, key: fields[i]._id}, function (err, userField) {
            if (err) {
              return workflow.emit('exception', err);
            }

            fields[i].value = userField.value;
            workflow.outcome.fields[userField.key] = {name: fields[i].name, value: userField.value};
            if (i >= fields.length - 1) {
              workflow.emit('renderProfile');
            }
          });
        })(i);
      }
    });
  });

  workflow.on('renderProfile', function () {
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
        delete workflow.outcome.fields;
        workflow.outcome.html = html;
        workflow.emit('response');
      }
    );
  });

  workflow.emit('validate');
};
