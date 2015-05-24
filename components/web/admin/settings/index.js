'use strict';
var crypto = require('crypto'),
  algorithm = 'aes-256-ctr';

var encrypt = function(req, token) {
  var password = req.app.config.cryptoKey;
  var cipher = crypto.createCipher(algorithm, password);
  var encrypted = cipher.update(token,'utf8','base64') + cipher.final('base64');
  return encrypted;
};

var decrypt = function(req, token) {
  var password = req.app.config.cryptoKey;
  var decipher = crypto.createDecipher(algorithm, password);
  var decrypted = decipher.update(token,'base64','utf8') + decipher.final('utf8');
  return decrypted;
};

var getFields = function() {
  return {
    general: {
      projectName: {
        name: 'Project Name',
        type: 'text',
        defaultValue: 'People'
      },
      systemEmail: {
        name: 'Project Email',
        type: 'text',
        defaultValue: 'your@email.com'
      },
      webhooksURL: {
        name: 'Webhooks URL',
        type: 'text',
        defaultValue: '',
        description: 'http://yourdomain.com/webhooks'
      },
      allowDomain: {
        name: 'Allow domain',
        type: 'text',
        defaultValue: '',
        description: 'http://yourdomain.com'
      }
    },
    loginAttempts: {
      loginAttemptsForIp: {
        name: 'Login Attempts For Ip',
        type: 'number',
        defaultValue: 50
      },
      loginAttemptsForIpAndUser: {
        name: 'Login Attempts For Ip And User',
        type: 'number',
        defaultValue: 7
      },
      loginAttemptsLogExpiration: {
        name: 'Login Attempts Log Expiration',
        type: 'text',
        defaultValue: '20m'
      }
    },
    smtp: {
      smtpFromName: {
        name: 'SMTP From Name',
        type: 'text',
        defaultValue: 'People Website'
      },
      smtpFromAddress: {
        name: 'SMTP From Address',
        type: 'text',
        defaultValue: 'your@email.com'
      },
      smtpHost: {
        name: 'SMTP Host',
        type: 'text',
        defaultValue: 'smtp.gmail.com'
      },
      smtpUser: {
        name: 'SMTP User',
        type: 'text',
        defaultValue: 'your@email.com',
        secure: true
      },
      smtpPassword: {
        name: 'SMTP Password',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      smtpSSL: {
        name: 'SMTP SSL',
        type: 'checkbox',
        defaultValue: true
      }
    },
    social: {
      twitterKey: {
        name: 'Twitter Key',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      twitterSecret: {
        name: 'Twitter Secret',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      facebookKey: {
        name: 'Facebook Key',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      facebookSecret: {
        name: 'Facebook Secret',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      githubKey: {
        name: 'GitHub Key',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      githubSecret: {
        name: 'GitHub Secret',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      googleKey: {
        name: 'Google Key',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      googleSecret: {
        name: 'Google Secret',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      tumblrKey: {
        name: 'Tumblr Key',
        type: 'text',
        defaultValue: '',
        secure: true
      },
      tumblrSecret: {
        name: 'Tumblr Secret',
        type: 'text',
        defaultValue: '',
        secure: true
      }
    }
  };
};

exports.read = function (req, res, next) {
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
  req.app.db.models.Settings.find({_id: {$in: keys}}).exec(function (err, settings) {
    if (err) {
      return callback(err);
    }

    for (var i in fields) {
      for (var j in fields[i]) {
        // Set field value to default value.
        fields[i][j].value = fields[i][j].defaultValue;
        for (var k = 0; k < settings.length; k++) {
          if (settings[k]._id === j) {
            // Override field value with data from the DB.
            if ('secure' in fields[i][j] && fields[i][j].secure === true) {
              settings[k].value = decrypt(req, settings[k].value);
            }
            fields[i][j].value = settings[k].value ? settings[k].value : fields[i][j].defaultValue;
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
        if ('secure' in fields[i][j] && fields[i][j].secure === true) {
          req.body[j] = encrypt(req, req.body[j]);
        }
        req.app.db.models.Settings.findOneAndUpdate({_id: j}, {value: req.body[j]}, {upsert: true}, function (err, setting) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.settings += setting;
        });
      }
    }

    return workflow.emit('response');
  });

  workflow.emit('validate');
};
