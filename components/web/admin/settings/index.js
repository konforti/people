'use strict';

exports.read = function (req, res, next) {
  var nconf = req.app.nconf;
  nconf.reset();
  nconf.load();

  //var settings = getSettings();
  var flat = {};
  var settings = nconf.get('settings');

  for (var i in settings) {
    for (var j in settings[i]) {
      // Set a flat structure obj.
      flat[j] = settings[i][j].value;
    }
  }

  var outcome = {
    fields: settings,
    record: escape(JSON.stringify(flat))
  };

  if (req.xhr) {
    res.send(outcome);
  }
  else {
    res.render('admin/settings/index', {
      data: outcome
    });
  }

};

exports.update = function (req, res, next) {
  var nconf = req.app.nconf;
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update settings.');
      return workflow.emit('response');
    }

    if (!req.body.projectName) {
      workflow.outcome.errfor.projectName = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchSettings');
  });

  workflow.on('patchSettings', function () {
    var settings = nconf.get('settings');

    for (var i in settings) {
      for (var j in settings[i]) {
        for (var k in req.body) {
          if (j === k) {
            if (k == 'smtpSSL') {
              console.log(req.body[k]);
            }
            settings[i][j].value = req.body[k];
          }
        }
      }
    }
    //nconf.set('settings', settings);
    nconf.save(function (err) {
      if (err) {
        return workflow.emit('exception', err);
      }
    });

    return workflow.emit('response');
  });

  workflow.emit('validate');
};
