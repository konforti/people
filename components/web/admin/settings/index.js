'use strict';
var getFields = function() {
  return {
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
    },
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
    },
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
      type: 'checkbox',
      defaultValue: true
    },
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
  };
}

exports.read = function (req, res, next) {
  var fields = getFields();
  var keys = Object.keys(fields);
  var or = [];

  for (var i = 0; i < keys.length; i++) {
    or.push({key: keys[i]});
  }

  req.app.db.models.Settings.find().or(or).exec(function (err, settings) {
    if (err) {
      return next(err);
    }

    for (var key in fields) {
      for (var i = 0; i < settings.length; i++) {
        fields[key].value = settings[i].key === key ? settings[i].value : fields[key].defaultValue;
      }
    }

    if (req.xhr) {
      res.send(fields);
    }
    else {
      res.render('admin/settings/index', {
        data: {
          fields: fields,
          record: escape(JSON.stringify(fields))
        }
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
    for (var key in fields) {
      req.app.db.models.Settings.findOneAndUpdate({key: key}, {key: req.body[key]}, {upsert: true}, function (err, settings) {
        if (err) {
          return workflow.emit('exception', err);
        }
        console.log(settings);
        workflow.outcome.settings += settings;
      });
    }

    return workflow.emit('response');
  });

  workflow.emit('validate');
};
