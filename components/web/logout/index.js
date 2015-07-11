'use strict';

var jwt = require('jsonwebtoken');

exports.init = function (req, res) {
  var payload = {};
  var settings = req.app.getSettings();
  res.cookie(req.app.locals.webJwtName, jwt.sign(payload, settings.cryptoKey));

  req.logout();
  res.redirect('/');
};
