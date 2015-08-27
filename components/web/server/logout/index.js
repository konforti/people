'use strict';

//var jwt = require('jsonwebtoken');

exports.init = function (req, res) {
  res.cookie(req.app.locals.webJwtName, null, {expires: new Date(Date.now() - 1)});

  //req.logout();
  res.redirect('/');
};
