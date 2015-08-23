'use strict';
var crypto = require('crypto');

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
        callback(err, null);
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

  var getSessions = function(callback) {
    var moment = require('moment');
    workflow.outcome.sessions = [];

    req.app.db.models.JwtSession.find({user: req.user.id}, function (err, sessions) {
      if (err) {
        callback(err, null);
      }

      sessions.forEach(function(session, index, arr) {
        var name = session.ua.device !== 'Other' ? session.ua.device : session.ua.browser + ' on ' + session.ua.os;
        var sess = {
          id: session.id,
          name: name,
          ip: session.ip,
          time: moment(session.time).format('MMM Do YY h:mm a'),
          current: session.id === req.user.jwtSession
        };

        workflow.outcome.sessions.push(sess);
      });

      callback(null);
    });
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

    if (req.xhr) {
      res.send(workflow.outcome.record);
    }
    else {
      req.app.render('remote/server/profile/index', {
        data: {
          record: workflow.outcome.record,
          fields: workflow.outcome.fields,
          socials: workflow.outcome.socials,
          sessions: workflow.outcome.sessions
        }
      }, function (err, html) {
        workflow.outcome.html = html;
        workflow.emit('response');
      });
    }
  };

  require('async').series([getFields, getRecord, getSocial, getSessions], asyncFinally);
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
        console.error('Error Sending Welcome Email: ' + err);
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

    req.app.render('remote/server/profile/index', {
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

    req.app.render('remote/server/profile/index', {
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
    if (req.body.secret === 'null') {
      req.body.secret = {};
      workflow.emit('patchUser');
    }
    else {
      if (req.body.code && req.body.code.length !== 6) {
        workflow.outcome.errfor.code = 'A 6-digit code is required.';
      }

      if (req.body.secret.length !== 16) {
        workflow.outcome.errors.push('The secret is wrong.');
      }

      var notp = require('notp');
      var b32 = require('thirty-two');
      req.body.secret = b32.decode(req.body.secret);
      var verified = notp.totp.verify(req.body.code, req.body.secret);
      if(!verified) {
        workflow.outcome.errors.push('Code is not verified.');
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('patchUser');
    }
  });

  workflow.on('patchUser', function () {
    var fieldsToSet = {};
    fieldsToSet.totp = req.body.secret;
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

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
          res.render('remote/server/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.disconnectOauth = function (req, res, next) {
  var social = req.params.social;
  var workflow = req.app.utility.workflow(req, res);
  var update = {};
  update[social] = {id: undefined};
  req.app.db.models.User.findByIdAndUpdate(req.user.id, update, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.removeSession = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  var cond = {_id: req.body.sid, user: req.user.id};
  req.app.db.models.JwtSession.findOneAndRemove(cond, function (err, session) {
    if (err) {
      return workflow.emit('exception', err);
      console.error('Error remove session' + err);
    }
    if (!session) {
      return workflow.emit('exception', 'Session not found.');
    }

    workflow.emit('response');
  });
};

