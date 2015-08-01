'use strict';

var renderSettings = function (req, res, next, oauthMessage) {
  var workflow = req.app.utility.workflow(req, res);

  var getAccount = function (callback) {
    req.app.db.models.User.findById(req.user.id).exec(function (err, record) {
      if (err) {
        callback(err, null);
      }

      workflow.outcome.record = record;
      return callback(null, 'done');
    });
  };

  var getFields = function (callback) {
    req.app.db.models.Field.find({}, 'name').sort('name').exec(function (err, fields) {
      if (err) {
        return callback(err, null);
      }

      workflow.outcome.fields = fields;
      return callback(null, 'done');
    });
  };

  var getSocial = function (callback) {
    workflow.outcome.socials = {};
    var settings = req.app.getSettings();
    req.app.config.socials.forEach(function(social, index, arr) {
      if (!!settings[social + 'Key']) {
        workflow.outcome.socials[social] = {
          key: !!settings[social + 'Key'],
          active: workflow.outcome.record[social] ? !!workflow.outcome.record[social].id : false
        };
      }
    });

    return callback(null, 'done');
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

    workflow.emit('response;');
    //res.render('web/server/account/index', {
    //  data: {
    //    record: escape(JSON.stringify(outcome.record)),
    //    fields: outcome.fields,
    //    socials: outcome.socials,
    //    sessions: outcome.sessions
    //  }
    //});
  };

  require('async').series([getAccount, getFields, getSocial, getSessions], asyncFinally);
};

exports.init = function (req, res, next) {
  renderSettings(req, res, next, '');
};

exports.connectOauth = function (req, res, next) {
  var social = req.params.social;
  req._passport.instance.authenticate(social, {callbackURL: '/account/' + social + '/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/');
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
        renderSettings(req, res, next, 'Another user has already connected with that account.');
      }
      else {
        var cond = {};
        cond[social + ".id"] = info.profile.id;
        req.app.db.models.User.findByIdAndUpdate(req.user.id, cond, function (err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/');
        });
      }
    });
  })(req, res, next);
};

exports.disconnectOauth = function (req, res, next) {
  var social = req.params.social;
  var cond = {};
  cond[social] = {id: undefined};
  req.app.db.models.User.findByIdAndUpdate(req.user.id, cond, function (err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/');
  });
};

exports.update = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (req.user.id === req.app.config.uid1) {
      workflow.outcome.errors.push('You\'re not allowed to update this user.');
      return workflow.emit('response');
    }

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

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function () {
    req.app.db.models.User.findOne({username: req.body.username, _id: {$ne: req.user.id}}, function (err, user) {
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
    req.app.db.models.User.findOne({
      email: req.body.email.toLowerCase(),
      _id: {$ne: req.user.id}
    }, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already taken';
        return workflow.emit('response');
      }

      workflow.emit('patchUser');
    });
  });

  workflow.on('patchUser', function () {
    var fieldsToSet = {
      username: req.body.username,
      email: req.body.email.toLowerCase(),
      fields: req.body.fields,
      search: [
        req.body.username,
        req.body.email
      ]
    };

    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      req.hooks.emit('userUpdate', user);
      workflow.outcome.user = user;
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};


exports.password = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (req.user.id === req.app.config.uid1) {
      workflow.outcome.errors.push('You\'re not allowed to change this user password.');
      return workflow.emit('response');
    }

    if (!req.body.newPassword) {
      workflow.outcome.errfor.newPassword = 'required';
    }

    if (!req.body.confirm) {
      workflow.outcome.errfor.confirm = 'required';
    }

    if (req.body.newPassword !== req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    req.app.db.models.User.encryptPassword(req.body.newPassword, function (err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = {password: hash};
      req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        req.hooks.emit('userPasswordChange', user);
        workflow.outcome.user = user;
        workflow.outcome.newPassword = '';
        workflow.outcome.confirm = '';
        workflow.emit('response');
      });
    });
  });

  workflow.emit('validate');
};

exports.delete = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (req.user.id === req.app.config.uid1) {
      workflow.outcome.errors.push('You\'re not allowed to delete this user.');
      return workflow.emit('response');
    }

    if (req.body._id.toString() === req.user.id) {
      workflow.outcome.errors.push('You may not delete yourself from user.');
      return workflow.emit('response');
    }

    workflow.emit('deleteUser');
  });

  workflow.on('deleteUser', function (err) {
    req.app.db.models.User.findByIdAndRemove(req.body._id.toString(), function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.removeSession = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  var cond = {_id: req.body.cid, user: req.user.id};
  req.app.db.models.JwtSession.findOneAndRemove(cond, function (err, session) {
    if (err) {
      return workflow.emit('exception', err);
    }
    if (!session) {
      return workflow.emit('exception', 'Session not found.');
    }

    workflow.emit('response');
  });
};