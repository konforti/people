'use strict';

var getFields = function() {
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
  var defaults = require(process.env.PWD + '/defaults.json');
  var fields = getFields();
  var outcome = {};
  var flat = {};
  var gather = {};
  for (var i in fields) {
    for (var j in fields[i]) {
      gather[j] = fields[i][j];
    }
  }

  var keys = Object.keys(gather);
  req.app.db.models.Settings.getParam(keys, function (err, params) {
    if (err) {
      return callback(err);
    }

    for (var i in fields) {
      for (var j in fields[i]) {
        // Set field value to default value.
        fields[i][j].value = defaults[j];
        for (var k in params) {
          if (k === j) {
            // Override field value with data from the DB.
            fields[i][j].value = params[k];
          }
        }
        // Set a flat structure obj.
        flat[j] = fields[i][j].value;
      }
    }

    outcome = {
      fields: fields,
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
  });
};

exports.update = function (req, res, next) {
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
    var fields = getFields();

    for (var i in fields) {
      for (var j in fields[i]) {
        req.app.db.models.Settings.setParam(j, req.body[j], function (err, param) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.settings += param;
        });
      }
    }

    return workflow.emit('response');
  });

  workflow.emit('validate');
};
