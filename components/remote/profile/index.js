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
    workflow.outcome.social = {};
    req.app.config.socials.forEach(function(social, index, arr) {
      workflow.outcome.social[social] = {
        key: !!settings[social + 'Key'],
        active: workflow.outcome.record[social] ? !!workflow.outcome.record[social].id : false
      };
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

    if (req.xhr) {
      res.send(workflow.outcome.record);
    }
    else {
      var csrfToken = crypto.pseudoRandomBytes(16).toString('hex');
      req.session.remoteToken = csrfToken;
      req.app.render('../remote/profile/index', {
        data: {
          csrfToken: csrfToken,
          record: workflow.outcome.record,
          fields: workflow.outcome.fields,
          social: workflow.outcome.social
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
      workflow.emit('getSocial');
    });
  });

  workflow.on('getSocial', function () {
    var settings = req.app.getSettings();
    workflow.outcome.social = {};
    req.app.config.socials.forEach(function(social, index, arr) {
      workflow.outcome.social[social] = {
        key: !!settings[social + 'Key'],
        active: workflow.outcome.record[social] ? !!workflow.outcome.record[social].id : false
      };
    });

    workflow.outcome.social = social;
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

    var csrfToken = crypto.pseudoRandomBytes(16).toString('hex');
    req.session.remoteToken = csrfToken;
    req.app.render('../remote/profile/index', {
        data: {
          csrfToken: csrfToken,
          record: workflow.outcome.record,
          fields: workflow.outcome.fields,
          social: workflow.outcome.social
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

exports.connectTwitter = function (req, res, next) {
  var outcome = {};
  req._passport.instance.authenticate('twitter', function (err, user, info) {
    if (!info || !info.profile) {
      return res.send('Authentication problem.');
    }

    req.app.db.models.User.findOne({'twitter.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        res.send('Another user has already connected with that Twitter account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'twitter.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }
          var settings = req.app.getSettings();
          outcome.allowDomain = settings.allowDomain;
          res.render('../remote/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.connectGitHub = function (req, res, next) {
  var outcome = {};
  req._passport.instance.authenticate('github', function (err, user, info) {
    if (!info || !info.profile) {
      return res.send('Authentication problem.');
    }

    req.app.db.models.User.findOne({'github.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        res.send('Another user has already connected with that GitHub account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'github.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }
          var settings = req.app.getSettings();
          outcome.allowDomain = settings.allowDomain;
          res.render('../remote/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.connectFacebook = function (req, res, next) {
  var outcome = {};
  req._passport.instance.authenticate('facebook', {callbackURL: '/account/facebook/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.send('Authentication problem.');
    }

    req.app.db.models.User.findOne({'facebook.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        res.send('Another user has already connected with that Facebook account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'facebook.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          var settings = req.app.getSettings();
          outcome.allowDomain = settings.allowDomain;
          res.render('../remote/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.connectGoogle = function (req, res, next) {
  var outcome = {};
  req._passport.instance.authenticate('google', {callbackURL: '/account/google/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.send('Authentication problem.');
    }

    req.app.db.models.User.findOne({'google.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        res.send('Another user has already connected with that Google account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'google.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          var settings = req.app.getSettings();
          outcome.allowDomain = settings.allowDomain;
          res.render('../remote/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.connectTumblr = function (req, res, next) {
  var outcome = {};
  req._passport.instance.authenticate('tumblr', {callbackURL: '/account/tumblr/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.send('Authentication problem.');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.findOne({'tumblr.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        res.send('Another user has already connected with that Tumblr account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'tumblr.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          var settings = req.app.getSettings();
          outcome.allowDomain = settings.allowDomain;
          res.render('../remote/profile/connect', {data: JSON.stringify(outcome)});
        });
      }
    });
  })(req, res, next);
};

exports.disconnectTwitter = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {twitter: {id: undefined}}, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.disconnectGitHub = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {github: {id: undefined}}, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.disconnectFacebook = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {facebook: {id: undefined}}, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.disconnectGoogle = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {google: {id: undefined}}, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.disconnectTumblr = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {tumblr: {id: undefined}}, function (err, user) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

