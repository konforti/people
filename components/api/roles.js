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

    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    results.filters = req.query;
    res.send(results);
  });
};

exports.read = function (req, res, next) {
  req.app.db.models.Role.findById(req.params.rid).exec(function (err, role) {
    if (err) {
      return next(err);
    }

    res.send(role);
  });
};