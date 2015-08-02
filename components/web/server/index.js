'use strict';

exports.init = function (req, res) {
  var settings = req.app.getSettings();
  res.render('web/server/index', {appName: settings.projectName});
};
