'use strict';
var fs = require('fs');
var crypto = require('crypto');


var getForm = function() {
  return {
    welcome: {
      name: 'Welcome',
      type: 'textarea'
    },
    forgot: {
      name: 'Forgot Password',
      type: 'textarea'
    },
    verify: {
      name: 'Verify Email',
      type: 'textarea'
    }
  }
};

exports.read = function (req, res, next) {
  var outcome = {};
  outcome.record = {};
  outcome.fields = getForm();

  try {
    outcome.record.register = fs.readFileSync(process.env.PWD + 'components/remote/register/email-markdown.md', {encoding: 'utf8'});
    outcome.record.forgot = fs.readFileSync(process.env.PWD + 'components/remote/forgot/email-markdown.md', {encoding: 'utf8'});
    outcome.record.verify = fs.readFileSync(process.env.PWD + 'components/remote/verification/email-markdown.md', {encoding: 'utf8'});
  }
  catch(e) {
  }



  var getFields = function (callback) {
    for (var key in outcome.fields) {
      if (outcome.fields.hasOwnProperty(key)) {
        outcome.fields[key].value = outcome.record[key];
      }
    }

    return callback(null, 'done');
  };

  var asyncFinally = function (err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(outcome);
    }
    else {
      res.render('admin/emails/index', {
        data: outcome
      });
    }
  };

  require('async').parallel([getFields, getKeys], asyncFinally);
};

exports.update = function (req, res, next) {
  var settings = req.app.getSettings();
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
    for (var key in settings) {
      if (settings.hasOwnProperty(key)) {
        if (key === 'allowDomains' || key === 'webhooksURL') {
          settings[key] = req.body[key].replace(/\s/g, '').split(',');
        }
        else {
          settings[key] = req.body[key];
        }
      }
    }

    fs.writeFile(process.env.PWD + '/settings.json', JSON.stringify(settings, null, '\t'), function (err) {
      if (err) {
        return workflow.emit('exception', err);
      }
      req.app.appSettings = settings;
      workflow.outcome.settings = settings;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.reset = function (req, res, next) {

  var settings = req.app.getSettings();
  var workflow = req.app.utility.workflow(req, res);

  settings = generateKey('sk', settings);

  workflow.outcome.settings = settings;
  return workflow.emit('response');
};