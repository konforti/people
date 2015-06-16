'use strict';

var renderSettings = function (req, res, next, oauthMessage) {
  var outcome = {};

  var getAccount = function (callback) {
    req.app.db.models.User.findById(req.user.id).exec(function (err, record) {
      if (err) {
        callback(err, null);
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

  var getSocial = function (callback) {
    var actives = [];
    var settings = req.app.getSettings();
    req.app.config.socials.forEach(function(social, index, arr) {
      if (settings[social + 'Key']) {
        actives.push(social);
      }
    });

    outcome.social = social;
    return callback(null, 'done');
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

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

    res.render('account/index', {
      data: {
        record: escape(JSON.stringify(outcome.record)),
        fields: outcome.fields,
        social: outcome.social
      }
    });
  };

  require('async').series([getAccount, getFields, getSocial], asyncFinally);
};

exports.init = function (req, res, next) {
  renderSettings(req, res, next, '');
};

exports.connectTwitter = function (req, res, next) {
  req._passport.instance.authenticate('twitter', function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/');
    }

    req.app.db.models.User.findOne({'twitter.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Twitter account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'twitter.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/');
        });
      }
    });
  })(req, res, next);
};

exports.connectGitHub = function (req, res, next) {
  req._passport.instance.authenticate('github', function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/');
    }

    req.app.db.models.User.findOne({'github.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that GitHub account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'github.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/');
        });
      }
    });
  })(req, res, next);
};

exports.connectFacebook = function (req, res, next) {
  req._passport.instance.authenticate('facebook', {callbackURL: '/account/facebook/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/');
    }

    req.app.db.models.User.findOne({'facebook.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Facebook account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'facebook.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/');
        });
      }
    });
  })(req, res, next);
};

exports.connectGoogle = function (req, res, next) {
  req._passport.instance.authenticate('google', {callbackURL: '/account/google/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/');
    }

    req.app.db.models.User.findOne({'google.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Google account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'google.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/');
        });
      }
    });
  })(req, res, next);
};

exports.connectTumblr = function (req, res, next) {
  req._passport.instance.authenticate('tumblr', {callbackURL: '/account/tumblr/callback/'}, function (err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.findOne({'tumblr.id': info.profile.id, _id: {$ne: req.user.id}}, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Tumblr account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, {'tumblr.id': info.profile.id}, function (err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/');
        });
      }
    });
  })(req, res, next);
};

exports.disconnectTwitter = function (req, res, next) {
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {twitter: {id: undefined}}, function (err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/');
  });
};

exports.disconnectGitHub = function (req, res, next) {
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {github: {id: undefined}}, function (err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/');
  });
};

exports.disconnectFacebook = function (req, res, next) {
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {facebook: {id: undefined}}, function (err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/');
  });
};

exports.disconnectGoogle = function (req, res, next) {
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {google: {id: undefined}}, function (err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/');
  });
};

exports.disconnectTumblr = function (req, res, next) {
  req.app.db.models.User.findByIdAndUpdate(req.user.id, {tumblr: {id: undefined}}, function (err, user) {
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

    if (req.user._id.toString() === req.user.id) {
      workflow.outcome.errors.push('You may not delete yourself from user.');
      return workflow.emit('response');
    }

    workflow.emit('deleteUser');
  });

  workflow.on('deleteUser', function (err) {
    req.app.db.models.User.findByIdAndRemove(req.user.id, function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
