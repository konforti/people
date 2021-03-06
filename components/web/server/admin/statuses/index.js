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

  req.app.db.models.Status.pagedFind({
    filters: filters,
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
      res.render('web/server/admin/statuses/index', {data: {results: escape(JSON.stringify(results))}});
    }
  });
};

exports.read = function (req, res, next) {
  req.app.db.models.Status.findById(req.params.id).exec(function (err, status) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(status);
    }
    else {
      res.render('web/server/admin/statuses/details', {data: {record: escape(JSON.stringify(status))}});
    }
  });
};

exports.create = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create statuses.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errors.push('A name is required.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateStatusCheck');
  });

  workflow.on('duplicateStatusCheck', function () {
    req.app.db.models.Status.findById(req.app.utility.slugify(req.body.name)).exec(function (err, status) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (status) {
        workflow.outcome.errors.push('That status is already taken.');
        return workflow.emit('response');
      }

      workflow.emit('createStatus');
    });
  });

  workflow.on('createStatus', function () {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.name),
      name: req.body.name
    };

    req.app.db.models.Status.create(fieldsToSet, function (err, status) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = status;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update statuses.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchStatus');
  });

  workflow.on('patchStatus', function () {
    var fieldsToSet = {
      name: req.body.name
    };

    req.app.db.models.Status.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, status) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.status = status;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete statuses.');
      return workflow.emit('response');
    }

    workflow.emit('deleteStatus');
  });

  workflow.on('deleteStatus', function (err) {
    req.app.db.models.Status.findByIdAndRemove(req.params.id, function (err, status) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
