'use strict';
var fs = require('fs');

var getTmpl = function() {
  return {
    register: process.cwd() + '/components/remote/server/register/email-markdown.md',
    forgot: process.cwd() + '/components/remote/server/forgot/email-markdown.md',
    verify: process.cwd() + '/components/remote/server/verify/email-markdown.md'
  };
};

var getForm = function() {
  return {
    register: {
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
  };
};

exports.read = function (req, res, next) {
  var outcome = {};
  outcome.record = {};
  outcome.fields = getForm();
  var tmpls = getTmpl();

  try {
    for (var key in tmpls) {
      if (tmpls.hasOwnProperty(key)) {
        outcome.record[key] = fs.readFileSync(tmpls[key], {encoding: 'utf8'});
      }
    }
  }
  catch(e) {
    console.error('err: ' + e);
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
      res.render('web/server/admin/emails/index', {
        data: outcome
      });
    }
  };

  require('async').parallel([getFields], asyncFinally);
};

exports.update = function (req, res, next) {
  var tmpls = getTmpl();
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.user.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update Email templates.');
      return workflow.emit('response');
    }

    workflow.emit('patchTmpl');
  });

  workflow.on('patchTmpl', function () {
    workflow.outcome.emails = {};
    for (var key in tmpls) {
      if (tmpls.hasOwnProperty(key)) {
        fs.writeFile(tmpls[key], req.body[key], function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.emails[key] = req.body[key];
        });
      }
    }

    return workflow.emit('response');
  });

  workflow.emit('validate');
};

exports.test = function (req, res, next) {
  var settings = req.app.getSettings();
  var id = req.query.id;
  req.app.utility.sendmail(req, res, {
    from: settings.smtpFromName + ' <' + settings.smtpFromAddress + '>',
    to: settings.systemEmail,
    subject: '[Test] for ' + id + ' mail',
    textPath: 'remote/server/' + id + '/email-text',
    htmlPath: 'remote/server/' + id + '/email-html',
    markdownPath: 'components/remote/server/' + id + '/email-markdown',
    locals: {
      username: req.user.username,
      verifyURL: req.protocol + '://' + req.headers.host + '/remote/server/verify/' + 'VeRYL0nGt0kEN' + '/',
      resetCode: 'VeRYL0nGt0kEN',
      projectName: settings.projectName
    },
    success: function () {
      res.send({
        success: true,
        email: settings.smtpFromAddress
      });
    },
    error: function (err) {
      res.send({
        success: false,
        err: err
      });
    }
  });
};