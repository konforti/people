'use strict';

exports.find = function (req, res, next) {
  req.query.name = req.query.name ? req.query.name : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';

  var filters = {};
  if (req.query.name) {
    filters.name = new RegExp('^.*?' + req.query.name + '.*$', 'i');
  }

  req.app.db.models.Role.pagedFind({
    filters: filters,
    keys: 'name',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      results.filters = req.query;
      res.send(results);
    }
    else {
      results.filters = req.query;
      res.render('web/server/admin/roles/index', {data: {results: escape(JSON.stringify(results))}});
    }
  });
};

exports.read = function (req, res, next) {
  req.app.db.models.Role.findById(req.params.id).exec(function (err, role) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(role);
    }
    else {
      res.render('web/server/admin/roles/details', {data: {record: escape(JSON.stringify(role))}});
    }
  });
};

exports.create = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create roles.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errors.push('Please enter a name.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateRoleCheck');
  });

  workflow.on('duplicateRoleCheck', function () {
    req.app.db.models.Role.findById(req.app.utility.slugify(req.body.name)).exec(function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (role) {
        workflow.outcome.errors.push('That role already exists.');
        return workflow.emit('response');
      }

      workflow.emit('createRole');
    });
  });

  workflow.on('createRole', function () {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.name),
      name: req.body.name
    };

    req.app.db.models.Role.create(fieldsToSet, function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = role;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update roles.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchRole');
  });

  workflow.on('patchRole', function () {
    var fieldsToSet = {
      name: req.body.name
    };

    req.app.db.models.Role.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.role = role;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.permissions = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not change the permissions of roles.');
      return workflow.emit('response');
    }

    if (!req.body.permissions) {
      workflow.outcome.errfor.permissions = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchRole');
  });

  workflow.on('patchRole', function () {
    var fieldsToSet = {
      permissions: req.body.permissions
    };

    req.app.db.models.Role.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.role = role;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete roles.');
      return workflow.emit('response');
    }

    workflow.emit('deleteRole');
  });

  workflow.on('deleteRole', function (err) {
    req.app.db.models.Role.findByIdAndRemove(req.params.id, function (err, role) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
