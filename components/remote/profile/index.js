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

  var getRecord = function (callback) {
    req.app.db.models.User.findById(req.user.id).exec(function (err, record) {
      if (err) {
        return next(err);
      }

      workflow.outcome.record = record;
      callback(null);
    });
  };

  var getFields = function (callback) {
    req.app.db.models.Field.find({}, 'name').sort('name').exec(function (err, fields) {
      if (err) {
        callback(err, null);
      }

      workflow.outcome.fields = fields;
      callback(null);
    });
  };

  var getSocial = function(callback) {
    var settings = req.app.getSettings();
    workflow.outcome.socials = {};
    req.app.config.socials.forEach(function(social, index, arr) {
      if (!!settings[social + 'Key']) {
        workflow.outcome.socials[social] = {
          key: !!settings[social + 'Key'],
          active: workflow.outcome.record[social] ? !!workflow.outcome.record[social].id : false
        };
      }
    });

    callback(null);
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

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

    workflow.outcome.record.totp = (typeof workflow.outcome.record.totp !== 'undefined' && workflow.outcome.record.totp.length > 0) ? 'checked' : '';
    if (req.xhr) {
      res.send(workflow.outcome.record);
    }
    else {
      req.app.render('remote/profile/index', {
        data: {
          record: workflow.outcome.record,
          fields: workflow.outcome.fields,
          socials: workflow.outcome.socials
        }
      }, function (err, html) {
        workflow.outcome.html = html;
        workflow.emit('response');
      });
    }
  };

  require('async').series([getFields, getRecord, getSocial], asyncFinally);
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

    require('../verify').sendVerificationEmail(req, res, {
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
      workflow.emit('getSocial');
    });
  });

  workflow.on('getSocial', function () {
    var settings = req.app.getSettings();
    workflow.outcome.socials = {};
    req.app.config.socials.forEach(function(social, index, arr) {
      workflow.outcome.socials[social] = {
        key: !!settings[social + 'Key'],
        active: workflow.outcome.record[social] ? !!workflow.outcome.record[social].id : false
      };
    });

    workflow.emit('renderProfile');
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

    req.app.render('remote/profile/index', {
        data: {
          record: workflow.outcome.record,
          fields: workflow.outcome.fields,
          socials: workflow.outcome.socials
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
    if (req.body.newPassword !== req.body.confirm) {
      workflow.outcome.errfor.password = 'password not match';
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

    req.app.render('remote/profile/index', {
        data: {
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
 * Update 2 step.
 * @param req
 * @param res
 * @param next
 */
exports.twostep = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (req.body.secret === null) {
      workflow.emit('patchUser');
    }

    var notp = require('notp');

    if (req.body.code.length !== 6) {
      workflow.outcome.errfor.code = 'A 6-digit code is required.';
    }
    console.log(req.body.code);
    console.log(req.body.secret);
    if (req.body.secret.length !== 16) {
      workflow.outcome.errors.push('The secret is wrong.');
    }

    var verified = notp.totp.verify(req.body.code, req.body.secret);
    console.log(verified);
    if(!verified) {
      workflow.outcome.errors.push('Code is not verified.');
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    var fieldsToSet = {};
    fieldsToSet.totp = req.body.secret;
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome = 'Success';
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};



exports.connectOauth = function (req, res, next) {
  var social = req.params.social;
  var outcome = {};
  req._passport.instance.authenticate(social,  {callbackURL: '/remote/connect/' + social + '/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.send('Authentication problem.');
    }

    if (social === 'tumblr' && !info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    var cond = {};
    cond[social + ".id"] = info.profile.id;
    cond._id = {$ne: req.user.id};
    req.app.db.models.User.findOne(cond, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        res.send('Another user has already connected with that account.');
      }
      else {
        var cond = {};
        cond[social + ".id"] = info.profile.id;
        req.app.db.models.User.findByIdAndUpdate(req.user.id, cond, function (err, user) {
          if (err) {
            return next(err);
          }
          res.render('remote/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.disconnectOauth = function (req, res, next) {
  var social = req.params.social;
  var workflow = req.app.utility.workflow(req, res);
  var cond = {};
  cond[social] = {id: undefined};
  req.app.db.models.User.findByIdAndUpdate(req.user.id, cond, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

