'use strict';

exports.find = function(req, res, next){
  var outcome = {};

  var getResults = function(callback) {
    req.query.username = req.query.username ? req.query.username : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.username) {
      filters.username = new RegExp('^.*?'+ req.query.username +'.*$', 'i');
    }

    if (req.query.isActive) {
      filters.isActive = req.query.isActive;
    }

    req.app.db.models.User.pagedFind({
      filters: filters,
      keys: 'username email isActive',
      limit: req.query.limit,
      page: req.query.page,
      sort: req.query.sort
    }, function(err, results) {
      if (err) {
        return callback(err);
      }

      outcome.results = results;
      return callback(null, 'done');
    });
  };

  var getStatusOptions = function(callback) {
    req.app.db.models.Status.find({}, 'name').sort('name').exec(function(err, statuses) {
      if (err) {
        return callback(err, null);
      }

      outcome.statuses = statuses;
      return callback(null, 'done');
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      outcome.results.filters = req.query;
      res.send(outcome.results);
    }
    else {
      outcome.results.filters = req.query;
      res.render('admin/users/index', {
        data: {
          results: JSON.stringify(outcome.results),
          statuses: outcome.statuses
        }
      });
    }
  };

  require('async').parallel([getResults, getStatusOptions], asyncFinally);
};

exports.read = function(req, res, next){
  var outcome = {};

  var getRecord = function(callback) {
    req.app.db.models.User.findById(req.params.id).populate('roles', 'name').exec(function(err, record) {
      if (err) {
        return callback(err);
      }
      outcome.record = record;
      return callback(null, 'done');
    });
  };

  var getRoles = function(callback) {
    req.app.db.models.Role.find({}, 'name').sort('name').exec(function(err, roles) {
      if (err) {
        return callback(err, null);
      }

      outcome.roles = roles;
      return callback(null, 'done');
    });
  };


  var getStatusOptions = function(callback) {
    req.app.db.models.Status.find({}, 'name').sort('name').exec(function(err, statuses) {
      if (err) {
        return callback(err, null);
      }

      outcome.statuses = statuses;
      return callback(null, 'done');
    });
  };

  var getUserFields = function(callback) {
    //var fields = req.app.config.fields;
    req.app.db.models.UserMeta.find({/*user: req.params.id*/}, 'name').sort('name').exec(function(err, fields) {
      if (err) {
        return callback(err, null);
      }

      outcome.fields = fields;
      return callback(null, 'done');
    });

  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(outcome.record);
    }
    else {
      res.render('admin/users/details', {
        data: {
          record: escape(JSON.stringify(outcome.record)),
          roles: outcome.roles,
          statuses: outcome.statuses,
          fields: outcome.fields
        }
      });
    }
  };

  require('async').parallel([getRoles, getRecord, getStatusOptions, getUserFields], asyncFinally);
};

exports.create = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.username) {
      workflow.outcome.errors.push('Please enter a username.');
      return workflow.emit('response');
    }

    if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errors.push('only use letters, numbers, -, _');
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    req.app.db.models.User.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errors.push('That username is already taken.');
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    var fieldsToSet = {
      username: req.body.username,
      search: [
        req.body.username
      ]
    };
    req.app.db.models.User.create(fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = user;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.isActive) {
      req.body.isActive = 'no';
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

  workflow.on('duplicateUsernameCheck', function() {
    req.app.db.models.User.findOne({ username: req.body.username, _id: { $ne: req.params.id } }, function(err, user) {
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
    req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.params.id } }, function(err, user) {
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

  workflow.on('patchUser', function() {
    var fieldsToSet = {
      isActive: req.body.isActive,
      username: req.body.username,
      email: req.body.email.toLowerCase(),
      search: [
        req.body.username,
        req.body.email
      ]
    };

    req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

    });
  });

  workflow.emit('validate');
};

exports.roles = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not change the role memberships of admins.');
      return workflow.emit('response');
    }

    if (!req.body.roles) {
      workflow.outcome.errfor.roles = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function() {
    var fieldsToSet = {
      roles: req.body.roles
    };

    req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      user.populate('roles', 'name', function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.user = user;
        workflow.emit('response');
      });
    });
  });

  workflow.emit('validate');
};

exports.password = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
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

  workflow.on('patchUser', function() {
    req.app.db.models.User.encryptPassword(req.body.newPassword, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = { password: hash };
      req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.user = user;
        workflow.outcome.newPassword = '';
        workflow.outcome.confirm = '';
        workflow.emit('response');
      });
    });
  });

  workflow.emit('validate');
};

exports.newNote = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.data) {
      workflow.outcome.errors.push('Data is required.');
      return workflow.emit('response');
    }

    workflow.emit('addNote');
  });

  workflow.on('addNote', function() {
    var noteToAdd = {
      data: req.body.data,
      userCreated: {
        id: req.user._id,
        name: req.user.username,
        time: new Date().toISOString()
      }
    };

    req.app.db.models.User.findByIdAndUpdate(req.params.id, { $push: { notes: noteToAdd } }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.account = user;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.newStatus = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.id) {
      workflow.outcome.errors.push('Please choose a status.');
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('addStatus');
  });

  workflow.on('addStatus', function() {
    var statusToAdd = {
      id: req.body.id,
      name: req.body.name,
      userCreated: {
        id: req.user._id,
        name: req.user.username,
        time: new Date().toISOString()
      }
    };

    req.app.db.models.User.findByIdAndUpdate(req.params.id, { status: statusToAdd, $push: { statusLog: statusToAdd } }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.account = user;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {

    if (req.user._id === req.params.id) {
      workflow.outcome.errors.push('You may not delete yourself from user.');
      return workflow.emit('response');
    }

    workflow.emit('deleteUser');
  });

  workflow.on('deleteUser', function(err) {
    req.app.db.models.User.findByIdAndRemove(req.params.id, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
