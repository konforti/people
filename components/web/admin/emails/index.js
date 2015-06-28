'use strict';
var fs = require('fs');

var getTmpl = function() {
  return {
    register: process.env.PWD + '/components/remote/register/email-markdown.md',
    forgot: process.env.PWD + '/components/remote/forgot/email-markdown.md',
    verify: process.env.PWD + '/components/remote/verification/email-markdown.md'
  }
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
  }
};

exports.read = function (req, res, next) {
  var outcome = {};
  outcome.record = {};
  outcome.fields = getForm();

  try {
    outcome.record.register = fs.readFileSync(process.env.PWD + '/components/remote/register/email-markdown.md', {encoding: 'utf8'});
    outcome.record.forgot = fs.readFileSync(process.env.PWD + '/components/remote/forgot/email-markdown.md', {encoding: 'utf8'});
    outcome.record.verify = fs.readFileSync(process.env.PWD + '/components/remote/verification/email-markdown.md', {encoding: 'utf8'});
  }
  catch(e) {
    console.log(e);
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

  require('async').parallel([getFields], asyncFinally);
};

exports.update = function (req, res, next) {
  var tmpls = getTmpl();
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
    for (var key in tmpls) {
      if (tmpls.hasOwnProperty(key)) {
        tmpls[key] = req.body[key]

        fs.writeFile(tmpls[key], req.body[key], function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }
          workflow.outcome.emails = tmpls;
          return workflow.emit('response');
        });
      }
    }


  });

  workflow.emit('validate');
};