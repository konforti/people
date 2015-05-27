'use strict';
(function() {
  var nconf = require('nconf');

  nconf.use('file', { file: './config.json' });
  nconf.load();
  nconf.set('name', 'Avian');
  nconf.set('dessert:name', 'Ice Cream');
  nconf.set('dessert:flavor', 'chocolate');

  console.log(nconf.get('dessert'));

  nconf.save(function (err) {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Configuration saved successfully.');
  });
})();

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
        defaultValue: 'your@email.com'
      },
      smtpPassword: {
        name: 'SMTP Password',
        type: 'text',
        defaultValue: ''
      },
      smtpSSL: {
        name: 'SMTP SSL',
        type: 'checkbox'
      }
    },
    social: {
      twitterKey: {
        name: 'Twitter Key',
        type: 'text',
        defaultValue: ''
      },
      twitterSecret: {
        name: 'Twitter Secret',
        type: 'text',
        defaultValue: ''
      },
      facebookKey: {
        name: 'Facebook Key',
        type: 'text',
        defaultValue: ''
      },
      facebookSecret: {
        name: 'Facebook Secret',
        type: 'text',
        defaultValue: ''
      },
      githubKey: {
        name: 'GitHub Key',
        type: 'text',
        defaultValue: ''
      },
      githubSecret: {
        name: 'GitHub Secret',
        type: 'text',
        defaultValue: ''
      },
      googleKey: {
        name: 'Google Key',
        type: 'text',
        defaultValue: ''
      },
      googleSecret: {
        name: 'Google Secret',
        type: 'text',
        defaultValue: ''
      },
      tumblrKey: {
        name: 'Tumblr Key',
        type: 'text',
        defaultValue: ''
      },
      tumblrSecret: {
        name: 'Tumblr Secret',
        type: 'text',
        defaultValue: ''
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
      return next(err);
    }

    for (var i in fields) {
      for (var j in fields[i]) {
        // Set field value to default value.
        fields[i][j].value = fields[i][j].defaultValue;
        for (var k = 0; k < settings.length; k++) {
          if (settings[k]._id === j) {
            // Override field value with data from the DB.
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
        //req.app.db.models.Settings.findOneAndUpdate({_id: j}, {value: req.body[j]}, {upsert: true}, function (err, setting) {
        //  if (err) {
        //    return workflow.emit('exception', err);
        //  }
        //
        //  workflow.outcome.settings += setting;
        //});
      }
    }

    return workflow.emit('response');
  });

  workflow.emit('validate');
};
