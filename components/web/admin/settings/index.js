'use strict';
var fs = require('fs');
var crypto = require('crypto');

var generateKey = function(type, settings) {
  settings.secretKey = type + '_' + crypto.randomBytes(15).toString('hex').toUpperCase();
  fs.writeFileSync(process.env.PWD + '/settings.json', JSON.stringify(settings, null, '\t'));

  return settings;
};

var getForm = function() {
  return {
    general: {
      projectName: {
        name: 'Project Name',
        type: 'text'
      },
      systemEmail: {
        name: 'Project Email',
        type: 'text'
      },
      webhooksURL: {
        name: 'Webhooks URL',
        type: 'text',
        description: 'http://yourdomain.com/webhooks'
      },
      allowDomain: {
        name: 'Allow domain',
        type: 'text',
        description: 'http://yourdomain.com'
      },
      defaultReturnUrl: {
        name: 'Default Return Url',
        type: 'text',
        description: 'http://yourdomain.com'
      }
    },
    loginAttempts: {
      loginAttemptsForIp: {
        name: 'Login Attempts For Ip',
        type: 'number'
      },
      loginAttemptsForIpAndUser: {
        name: 'Login Attempts For Ip And User',
        type: 'number'
      },
      loginAttemptsLogExpiration: {
        name: 'Login Attempts Log Expiration',
        type: 'text'
      }
    },
    smtp: {
      smtpFromName: {
        name: 'SMTP From Name',
        type: 'text'
      },
      smtpFromAddress: {
        name: 'SMTP From Address',
        type: 'text'
      },
      smtpHost: {
        name: 'SMTP Host',
        type: 'text',
        defaultValue: 'smtp.gmail.com'
      },
      smtpUser: {
        name: 'SMTP User',
        type: 'text'
      },
      smtpPassword: {
        name: 'SMTP Password',
        type: 'text'
      },
      smtpSSL: {
        name: 'SMTP SSL',
        type: 'checkbox'
      }
    },
    social: {
      twitterKey: {
        name: 'Twitter Key',
        type: 'text'
      },
      twitterSecret: {
        name: 'Twitter Secret',
        type: 'text'
      },
      facebookKey: {
        name: 'Facebook Key',
        type: 'text'
      },
      facebookSecret: {
        name: 'Facebook Secret',
        type: 'text'
      },
      githubKey: {
        name: 'GitHub Key',
        type: 'text'
      },
      githubSecret: {
        name: 'GitHub Secret',
        type: 'text'
      },
      googleKey: {
        name: 'Google Key',
        type: 'text'
      },
      googleSecret: {
        name: 'Google Secret',
        type: 'text'
      },
      tumblrKey: {
        name: 'Tumblr Key',
        type: 'text'
      },
      tumblrSecret: {
        name: 'Tumblr Secret',
        type: 'text'
      }
    }
  };
};

exports.read = function (req, res, next) {
  var outcome = {};
  outcome.record = req.app.getSettings();
  outcome.fields = getForm();
  console.log(outcome.record);
  var getFields = function (callback) {
    for (var i in outcome.fields) {
      for (var j in outcome.fields[i]) {
        // Set field value to default value.

        outcome.fields[i][j].value = outcome.record[j];

      }
    }

    return callback(null, 'done');
  };

  var getKeys = function (callback) {
    if (!outcome.record.publicKey) {
      outcome.record = generateKey('pk', outcome.record);
    }

    if (!outcome.record.secretKey) {
      outcome.record = generateKey('sk', outcome.record);
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
      res.render('admin/settings/index', {
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
    for (var i in settings) {
      settings[i] = req.body[i];
    }

    fs.writeFile(process.env.PWD + '/settings.json', JSON.stringify(settings, null, '\t'), function (err) {
      if (err) {
        return workflow.emit('exception', err);
      }

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