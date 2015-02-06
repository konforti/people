'use strict';
var crypto = require('crypto');
var signature = require('cookie-signature');

/**
 *
 * @param req
 * @param res
 */
exports.info = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('validate', function() {
    workflow.emit('getInfo');
  });

  workflow.on('getInfo', function() {
    var socials = [];
    for (var name in req.app.config.oauth) {
      if (req.app.config.oauth[name].key) {
        socials.push(name);
      }
    }
    workflow.outcome.info = {
      socials: socials
    };

    workflow.emit('response');
  });

  workflow.emit('validate');
};

/**
 *
 * @param req
 * @param res
 */
exports.signup = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
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

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    req.app.db.models.User.findOne({username: req.body.username}, function(err, user) {
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

  workflow.on('duplicateEmailCheck', function() {
    req.app.db.models.User.findOne({email: req.body.email.toLowerCase()}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = {
        isActive: 'yes',
        username: req.body.username,
        email:    req.body.email.toLowerCase(),
        password: hash,
        search:   [
          req.body.username,
          req.body.email
        ]
      };
      req.app.db.models.User.create(fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.user = user;
        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    req.app.utility.sendmail(req, res, {
      from:     req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
      to:       req.body.email,
      subject:  'Your ' + req.app.config.projectName + ' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals:   {
        username:    req.body.username,
        email:       req.body.email,
        projectName: req.app.config.projectName
      },
      success:  function(message) {
        workflow.emit('logUserIn');
      },
      error:    function(err) {
        console.log('Error Sending Welcome Email: ' + err);
        workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function() {
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
        return workflow.emit('response');
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          var gravatarHash = crypto.createHash('md5').update(req.email).digest('hex');
          var sid = signature.sign(req.sessionID, req.app.config.cryptoKey);

          workflow.outcome.sid = sid;
          workflow.outcome.user = {
            email:    user.email,
            username: user.username,
            avatar: 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g'
          };
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

/**
 *
 * @param req
 * @param res
 */
exports.login = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('abuseFilter');
  });

  workflow.on('abuseFilter', function() {
    var getIpCount = function(done) {
      var conditions = {ip: req.ip};
      req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var getIpUserCount = function(done) {
      var conditions = {ip: req.ip, user: req.body.username};
      req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var asyncFinally = function(err, results) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (results.ip >= req.app.config.loginAttempts.forIp || results.ipUser >= req.app.config.loginAttempts.forIpAndUser) {
        workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
        return workflow.emit('response');
      }
      else {
        workflow.emit('attemptLogin');
      }
    };

    require('async').parallel({ip: getIpCount, ipUser: getIpUserCount}, asyncFinally);
  });

  workflow.on('attemptLogin', function() {
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        var fieldsToSet = {ip: req.ip, user: req.body.username};
        req.app.db.models.LoginAttempt.create(fieldsToSet, function(err, doc) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
          return workflow.emit('response');
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          var gravatarHash = crypto.createHash('md5').update(user.email).digest('hex');
          var sid = signature.sign(req.sessionID, req.app.config.cryptoKey);

          workflow.outcome.sid = sid;
          workflow.outcome.user = {
            email:    user.email,
            username: user.username,
            avatar: 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g'
          };

          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupTwitter = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('twitter', {callbackURL: '/remote/signup/twitter/callback/'}, function(err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      return workflow.outcome.errfor.username = 'No info';
    }

    req.app.db.models.User.findOne({'twitter.id': info.profile.id}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.profile_image_url;
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
        }
      }
      else {
        // Login.
        workflow.user = user;
        loginSocial(req, res, workflow);
      }
    });
  })(req, res, next);
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupGitHub = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('github', {callbackURL: '/remote/signup/github/callback/'}, function(err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      return workflow.outcome.errfor.username = 'No info';
    }

    req.app.db.models.User.findOne({'github.id': info.profile.id}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.avatar_url;
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
        }
      }
      else {
        // Login.
        workflow.user = user;
        loginSocial(req, res, workflow);
      }
    });
  })(req, res, next);
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupFacebook = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('facebook', {callbackURL: '/remote/signup/facebook/callback/'}, function(err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      return workflow.outcome.errfor.username = 'No info';
    }

    req.app.db.models.User.findOne({'facebook.id': info.profile.id}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = '//graph.facebook.com/' + info.profile.id + '/picture?height=100&width=100';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
        }
      }
      else {
        // Login.
        workflow.user = user;
        loginSocial(req, res, workflow);
      }
    });
  })(req, res, next);
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupGoogle = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('google', {callbackURL: '/remote/signup/google/callback/'}, function(err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      return workflow.outcome.errfor.username = 'No info';
    }

    req.app.db.models.User.findOne({'google.id': info.profile.id}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      info.profile.avatar = info.profile._json.image.url + '?sz=100';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
        }
      }
      else {
        // Login.
        workflow.user = user;
        loginSocial(req, res, workflow);
      }
    });
  })(req, res, next);
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.signupTumblr = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  req._passport.instance.authenticate('tumblr', {callbackURL: '/remote/signup/tumblr/callback/'}, function(err, user, info) {
    if (err) {
      return workflow.emit('exception', err);
    }

    if (!info || !info.profile) {
      return workflow.outcome.errfor.username = 'No info';
    }

    req.app.db.models.User.findOne({'tumblr.id': info.profile.id}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      //info.profile.avatar = info.profile._json.image.url + '?sz=100';
      req.session.socialProfile = info.profile;

      if (!user) {
        // Register.
        if (!info.profile.emails || !info.profile.emails[0].value) {
          res.render('../remote/social/need-mail', {email: info.profile.emails && info.profile.emails[0].value || ''});
        }
        else {
          signupSocial(req, res, next);
        }
      }
      else {
        // Login.
        workflow.user = user;
        loginSocial(req, res, workflow);
      }
    });
  })(req, res, next);
};

/**
 * signupSocial().
 * @type {Function}
 */
var signupSocial = exports.signupSocial = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.email = '';
  if (req.session.socialProfile && req.session.socialProfile.emails && req.session.socialProfile.emails[0].value) {
    workflow.email = req.session.socialProfile.emails[0].value;
  }
  else {
    workflow.email = req.body.email;
  }

  workflow.on('validate', function() {
    if (req.body.email) {
      if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
        workflow.outcome.errfor.email = 'invalid email format';
      }
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    workflow.username = req.session.socialProfile.username || req.session.socialProfile.id;
    if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
      workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
    }

    req.app.db.models.User.findOne({username: workflow.username}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.username = workflow.username + req.session.socialProfile.id;
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function() {
    req.app.db.models.User.findOne({email: workflow.email.toLowerCase()}, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    var fieldsToSet = {
      isActive:   'yes',
      isVerified: 'yes',
      username:   workflow.username,
      email:      workflow.email.toLowerCase(),
      search:     [
        workflow.username,
        workflow.email
      ]
    };
    fieldsToSet[req.session.socialProfile.provider] = {id: req.session.socialProfile.id};

    req.app.db.models.User.create(fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.user = user;
      workflow.emit('sendWelcomeEmail');
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    req.app.utility.sendmail(req, res, {
      from:     req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
      to:       workflow.email,
      subject:  'Your ' + req.app.config.projectName + ' Account',
      textPath: '../remote/signup/email-text',
      htmlPath: '../remote/signup/email-html',
      locals:   {
        username:    workflow.username,
        email:       workflow.email,
        projectName: req.app.config.projectName
      },
      success:  function(message) {
        workflow.emit('logUserIn');
      },
      error:    function(err) {
        console.log('Error Sending Welcome Email: ' + err);
        workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function() {
    loginSocial(req, res, workflow);
  });

  workflow.emit('validate');
};

/**
 * loginSocial().
 * @param req
 * @param res
 * @param next
 */
var loginSocial = function(req, res, workflow) {

  req.login(workflow.user, function(err) {
    if (err) {
      return workflow.emit('exception', err);
    }

    workflow.user.avatar = '';
    if (req.session.socialProfile && req.session.socialProfile.avatar) {
      workflow.user.avatar = req.session.socialProfile.avatar;
    }
    else {
      var gravatarHash = crypto.createHash('md5').update(req.email).digest('hex');
      workflow.user.avatar = 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g';
    }

    var sid = signature.sign(req.sessionID, req.app.config.cryptoKey);

    workflow.outcome.success = !workflow.hasErrors();
    workflow.outcome.allowDomain = req.app.config.allowDomain;
    workflow.outcome.sid = sid;
    workflow.outcome.user = {
      email:    workflow.user.email,
      username: workflow.user.username,
      avatar:   workflow.user.avatar
    };
    delete req.session.socialProfile;

    if (!req.body.email) {
      res.render('../remote/social/success', {data: JSON.stringify(workflow.outcome)});
    }
    else {
      workflow.emit('response');
    }
  });
};

/**
 * Profile().
 * @param req
 * @param res
 */
exports.readProfile = function(req, res, next) {
  var outcome = {};

  var getRecord = function(callback) {
    var collection = req.app.db.collection('sessions');
    var sid = signature.unsign(req.query.sid, req.app.config.cryptoKey);

    collection.find({_id: sid}).toArray(function(err, record) {
      if (err) {
        return callback(err, null);
      }
      if (record && record[0]) {
        var session = JSON.parse(record[0].session);

        req.app.db.models.User.findById(session.passport.user).exec(function(err, record) {
          if (err) {
            return callback(err);
          }
          outcome.record = record;
          return callback(null, 'done');
        });
      }
    });
  };

  var getUserFields = function(callback) {
    var collection = req.app.db.collection('sessions');
    var sid = signature.unsign(req.query.sid, req.app.config.cryptoKey);

    collection.find({_id: sid}).toArray(function(err, record) {
      if (err) {
        return callback(err, null);
      }

      if (record && record[0]) {
        var session = JSON.parse(record[0].session);
        req.app.db.models.UserMeta.find({user: session.passport.user}).exec(function(err, fields) {
          if (err) {
            return callback(err, null);
          }

          outcome.fields = [];
          for (var i = 0, field; field = req.app.config.fields[i]; ++i) {
            outcome.fields[i] = field;
            outcome.fields[i].value = typeof fields[i] !== 'undefined' ? fields[i].value : '';
          }

          return callback(null, 'done');
        });
      }
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    req.app.render('../remote/profile/index', {
        data: {
          record: outcome.record,
          fields: outcome.fields
        }
      }, function(err, html) {

        res.send(html);
      }
    );
  };

  require('async').parallel([getRecord, getUserFields], asyncFinally);
};

/**
 * Update a user.
 * @param req
 * @param res
 * @param next
 */
exports.updateProfile = function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    workflow.emit('getUID');
  });

  workflow.on('getUID', function(callback) {
    var collection = req.app.db.collection('sessions');
    var sid = signature.unsign(req.body.sid, req.app.config.cryptoKey);

    collection.find({_id: sid}).toArray(function(err, record) {
      if (err) {
        return callback(err, null);
      }

      if (record && record[0]) {
        var session = JSON.parse(record[0].session);
        workflow.emit('patchUser', session.passport.user);
      }
    });
  });

  workflow.on('patchUser', function(uid) {
    var fieldsToSet = {};

    fieldsToSet.username = req.body.username;
    fieldsToSet.email = req.body.email;

    req.app.db.models.User.findByIdAndUpdate(uid, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = user;
      return workflow.emit('response');
    });

    workflow.emit('patchUFields', uid);
  });

  workflow.on('patchFields', function(uid) {
    workflow.outcome.fields = [];
    var fields = req.app.config.fields;

    for (var i = 0, field; field = fields[i]; ++i) {

      var extraFieldsToSet = {};
      if (typeof req.body[field.key] !== 'undefined') {
        extraFieldsToSet.key = field.key;
        extraFieldsToSet.value = req.body[field.key];
      }

      req.app.db.models.UserMeta.findOneAndUpdate({user: uid, key: field.key}, extraFieldsToSet, {upsert: true}, function(err, userField) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.fields += userField;
      });
    }

    req.app.render('../remote/profile/index', {
        data: {
          record: workflow.outcome.record,
          fields: workflow.outcome.fields
        }
      }, function(err, html) {
        res.send(html);
      }
    );
  });

  workflow.emit('validate');
};
