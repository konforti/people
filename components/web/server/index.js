'use strict';

exports.init = function (req, res) {
  var settings = req.app.getSettings();
  var record = {
    appName: settings.projectName,
    sessionExp: settings.sessionExp
  };
  res.render('web/server/index', {data: record});
};
