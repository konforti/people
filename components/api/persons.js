'use strict';

var signature = require('cookie-signature');

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
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.username) {
      filters.username = new RegExp('^.*?' + req.query.username + '.*$', 'i');
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
  var outcome = {};

  var getRecord = function (callback) {
    req.app.db.models.User.findById(req.params.id).populate('roles', 'name').exec(function (err, record) {
      if (err) {
        return callback(err);
      }
      outcome.record = record;
      return callback(null, 'done');
    });
  };

  var getUserFields = function (callback) {
    req.app.db.models.UserMeta.find({user: req.params.id}).sort('name').exec(function (err, fields) {
      if (err) {
        return callback(err, null);
      }

      outcome.fields = [];
      req.app.db.models.Field.getAll(function(err, list) {
        for (var i in list) {
          outcome.fields[i] = list[i];

          for (var j in fields) {
            if (fields[j].key === list[i].key) {
              outcome.fields[i].value = typeof fields[j] !== 'undefined' ? fields[j].value : '';
            }
          }
        }

        return callback(null, 'done');
      });
    });
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

    res.send({record: outcome.record, fields: outcome.fields});
  };

  require('async').parallel([getRecord, getUserFields], asyncFinally);
};

/**
 * Retrieve a user by session id.
 * @param req
 * @param res
 * @param next
 */
exports.readCurrent = function (req, res, next) {
  var outcome = {};

  var getRecord = function (callback) {
    var collection = req.app.db.collection('sessions');
    var sid = signature.unsign(req.params.sid, req.app.config.cryptoKey);

    collection.find({_id: sid}).toArray(function (err, record) {
      if (err) {
        return callback(err, null);
      }

      if (!record || !record[0]) {
        return callback('No Record', null);
      }
      var session = JSON.parse(record[0].session);
      req.app.db.models.User.findById(session.passport.user).populate('roles', 'name').exec(function (err, record) {
        if (err) {
          return callback(err);
        }
        outcome.record = record;
        return callback(null, 'done');
      });
    });
  };

  var getUserFields = function (callback) {
    var collection = req.app.db.collection('sessions');
    var sid = signature.unsign(req.params.sid, req.app.config.cryptoKey);

    collection.find({_id: sid}).toArray(function (err, record) {
      if (err) {
        return callback(err, null);
      }

      if (!record || !record[0]) {
        return callback('No Record', null);
      }

      var session = JSON.parse(record[0].session);
      req.app.db.models.UserMeta.find({user: session.passport.user}).exec(function (err, fields) {
        if (err) {
          return callback(err, null);
        }

        outcome.fields = [];
        for (var i = 0; i < req.app.config.fields.length; i++) {
          outcome.fields[i] = req.app.config.fields[i];

          for (var j = 0; j < fields.length; j++) {
            if (fields[j].key === req.app.config.fields[i].key) {
              outcome.fields[i].value = typeof fields[j] !== 'undefined' ? fields[j].value : '';
            }
          }
        }

        return callback(null, 'done');
      });

    });
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

    res.send({record: outcome.record, fields: outcome.fields});
  };

  require('async').parallel([getRecord, getUserFields], asyncFinally);
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
    //if (req.body.isActive) {}

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    var fieldsToSet = {};

    if (req.body.isActive) {
      fieldsToSet.isActive = req.body.isActive;

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

/**
 * Update a user extra fields.
 * @param req
 * @param res
 * @param next
 */
exports.updateFields = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    //if (req.body.isActive) {}

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function () {
    workflow.outcome.fields = [];
    var fields = req.app.config.fields;

    for (var i = 0; i < fields.length; i++) {
      var extraFieldsToSet = {};
      extraFieldsToSet.key = fields[i].key;
      extraFieldsToSet.value = req.body[fields[i].key];

      (function(i) {
        req.app.db.models.UserMeta.findOneAndUpdate({
          user: req.params.id,
          key: fields[i].key
        }, extraFieldsToSet, {upsert: true}, function (err, userField) {
          if (err) {
            return workflow.emit('exception', err);
          }

          fields[i].value = userField.value;
          workflow.outcome.fields.push(fields[i]);
          if (i >= fields.length - 1) {
            exports.read(req, res, next);
          }
        });
      })(i);
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
    //if (req.body.role) {}

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
    //if (req.params.role) {}

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