'use strict';

/**
 * List all users.
 * @param req
 * @param res
 * @param next
 */
exports.find = function (req, res, next) {
  var outcome = {};

  var getResults = function (callback) {
    req.query.username = req.query.username ? req.query.username : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '-timeCreated';

    var filters = {};
    if (req.query.username) {
      filters.username = new RegExp('^.*?' + req.query.username + '.*$', 'i');
    }

    if (req.query.mode) {
      filters.mode = req.query.mode;
    }

    req.app.db.models.User.pagedFind({
      filters: filters,
      keys: 'username email mode',
      limit: req.query.limit,
      page: req.query.page,
      sort: req.query.sort
    }, function (err, results) {
      if (err) {
        return callback(err);
      }

      outcome.results = results;
      return callback(null, 'done');
    });
  };

  var getStatusOptions = function (callback) {
    req.app.db.models.Status.find({}, 'name').sort('name').exec(function (err, statuses) {
      if (err) {
        return callback(err, null);
      }

      outcome.statuses = statuses;
      return callback(null, 'done');
    });
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    outcome.results.filters = req.query;
    res.send(outcome.results);
  };

  require('async').parallel([getResults, getStatusOptions], asyncFinally);
};

/**
 * Retrieve a user.
 * @param req
 * @param res
 * @param next
 */
exports.read = function (req, res, next) {
  req.app.db.models.User.findById(req.params.id).populate('roles', 'name').exec(function (err, record) {
    if (err) {
      return next(err);
    }
    res.send({record: record});
  });
};

/**
 * Retrieve a user by session id.
 * @param req
 * @param res
 * @param next
 */
exports.readCurrent = function (req, res, next) {
  var settings = req.app.getSettings();
  var jwt = require('jsonwebtoken');
  jwt.verify(req.params.jwt, settings.cryptoKey, function(err, decoded) {
    if (err || !decoded) {
      return next(err);
    }

    req.app.db.models.User.findById(decoded.id).populate('roles', 'name').exec(function (err, record) {
      if (err) {
        return next(err);
      }

      res.send({record: record});
    });
  });
};

/**
 * Update a user.
 * @param req
 * @param res
 * @param next
 */
exports.update = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    // if (req.body.mode) {}

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    var fieldsToSet = {};

    if (req.body.mode) {
      fieldsToSet.mode = req.body.mode;

      req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        req.hooks.emit('userUpdate', user);
        workflow.outcome.record = user;
        return workflow.emit('response');
      });
    }
  });

  workflow.emit('validate');
};

/**
 * Add role to user.
 * @param req
 * @param res
 * @param next
 */
exports.createRoles = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    // if (req.body.role) {}

    workflow.emit('roleExistCheck');
  });

  workflow.on('roleExistCheck', function () {
    req.app.db.models.Role.findOne({_id: req.body.role}, function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!role) {
        workflow.outcome.errfor.role = 'role not exist';
        return workflow.emit('response');
      }

      workflow.emit('duplicateRoleCheck');
    });
  });

  workflow.on('duplicateRoleCheck', function () {
    req.app.db.models.User.findById(req.params.id).exec(function (err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      user.roles.forEach(function (role, i, arr) {
        if (role._id === req.body.role) {

          workflow.outcome.errfor.email = 'user already have this role';
          return workflow.emit('response');
        }
      });

      workflow.emit('patchUser', user);
    });
  });

  workflow.on('patchUser', function (user) {
    var fieldsToSet = {};

    if (req.body.role) {
      user.roles.push(req.body.role);
      fieldsToSet.roles = user.roles;

      req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = user;
        return workflow.emit('response');
      });
    }
  });

  workflow.emit('validate');
};

exports.deleteRoles = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    // if (req.params.role) {}

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function (user) {
    var fieldsToSet = {};

    if (req.params.role) {
      req.app.db.models.User.findById(req.params.id).exec(function (err, user) {
        var index = user.roles.indexOf(req.params.role);
        if (index !== -1) {
          user.roles.splice(index, 1);
          fieldsToSet.roles = user.roles;
          req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, user) {
            if (err) {
              return workflow.emit('exception', err);
            }

            workflow.outcome.record = user;
            return workflow.emit('response');
          });
        }
      });
    }
  });

  workflow.emit('validate');
};