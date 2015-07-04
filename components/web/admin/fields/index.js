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

  req.app.db.models.Field.pagedFind({
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
      res.render('web/admin/fields/index', {data: {results: escape(JSON.stringify(results))}});
    }
  });
};

exports.read = function (req, res, next) {
  req.app.db.models.Field.findById(req.params.id).exec(function (err, field) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(field);
    }
    else {
      res.render('web/admin/fields/details', {data: {record: escape(JSON.stringify(field))}});
    }
  });
};

exports.create = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create fields.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errors.push('Please enter a name.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateFieldCheck');
  });

  workflow.on('duplicateFieldCheck', function () {
    req.app.db.models.Field.findById(req.app.utility.slugify(req.body.name)).exec(function (err, field) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (field) {
        workflow.outcome.errors.push('That field already exists.');
        return workflow.emit('response');
      }

      workflow.emit('createField');
    });
  });

  workflow.on('createField', function () {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.name),
      name: req.body.name
    };

    req.app.db.models.Field.create(fieldsToSet, function (err, field) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = field;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update fields.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchField');
  });

  workflow.on('patchField', function () {
    var fieldsToSet = {
      name: req.body.name
    };

    req.app.db.models.Field.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, field) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.field = field;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete fields.');
      return workflow.emit('response');
    }

    workflow.emit('deleteField');
  });

  workflow.on('deleteField', function (err) {
    req.app.db.models.Field.findByIdAndRemove(req.params.id, function (err, field) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
