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

  req.app.db.models.Rule.pagedFind({
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
      res.render('admin/rules/index', {data: {results: escape(JSON.stringify(results))}});
    }
  });
};

exports.read = function (req, res, next) {
  req.app.db.models.Rule.findById(req.params.id).exec(function (err, rule) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(rule);
    }
    else {
      res.render('admin/rules/details', {
        data: {
          record: escape(JSON.stringify(rule))
        }
      });
    }
  });
};

exports.create = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create rules.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errors.push('Please enter a name.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateRuleCheck');
  });

  workflow.on('duplicateRuleCheck', function () {
    req.app.db.models.Rule.findById(req.app.utility.slugify(req.body.name)).exec(function (err, rule) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (rule) {
        workflow.outcome.errors.push('That rule already exists.');
        return workflow.emit('response');
      }

      workflow.emit('createRule');
    });
  });

  workflow.on('createRule', function () {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.name),
      name: req.body.name
    };

    req.app.db.models.Rule.create(fieldsToSet, function (err, rule) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = rule;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update rules.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchRule');
  });

  workflow.on('patchRule', function () {
    var fieldsToSet = {
      name: req.body.name,
      event: req.body.event,
      and_or: req.body.and_or,
      conditions: req.body.conditions,
      actions: req.body.actions
    };
    console.log(fieldsToSet);
    req.app.db.models.Rule.findByIdAndUpdate(req.params.id, fieldsToSet, function (err, rule) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.rule = rule;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function (req, res, next) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete rules.');
      return workflow.emit('response');
    }

    workflow.emit('deleteRule');
  });

  workflow.on('deleteRule', function (err) {
    req.app.db.models.Rule.findByIdAndRemove(req.params.id, function (err, rule) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
