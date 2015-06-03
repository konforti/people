'use strict';

exports = module.exports = function (req, res, options) {
  /* options = {
  from: String,
  to: String,
  cc: String,
  bcc: String,
  text: String,
  textPath String,
  html: String,
  htmlPath: String,
  attachments: [String],
  success: Function,
  error: Function
} */

  var renderText = function (callback) {
    res.render(options.textPath, options.locals, function (err, text) {
      if (err) {
        callback(err, null);
      }
      else {
        options.text = text;
        return callback(null, 'done');
      }
    });
  };

  var renderHtml = function (callback) {
    res.render(options.htmlPath, options.locals, function (err, html) {
      if (err) {
        callback(err, null);
      }
      else {
        options.html = html;
        return callback(null, 'done');
      }
    });
  };

  var renderers = [];
  if (options.textPath) {
    renderers.push(renderText);
  }

  if (options.htmlPath) {
    renderers.push(renderHtml);
  }

  require('async').parallel(
    renderers,
    function (err, results) {
      if (err) {
        options.error('Email template render failed. ' + err);
        return;
      }

      var attachments = [];

      if (options.html) {
        attachments.push({data: options.html, alternative: true});
      }

      if (options.attachments) {
        for (var i = 0; i < options.attachments.length; i++) {
          attachments.push(options.attachments[i]);
        }
      }

      var nodemailer = require('nodemailer');
      // Create reusable transporter object using SMTP transport.
      var settings = req.app.getSettings();
      var transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword
        }
      });
      // setup e-mail data with unicode symbols
      var mailOptions = {
        from: options.from,
        to: options.to,
        'reply-to': options.replyTo || options.from,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        attachment: attachments
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function (err, message) {
        if (err) {
          options.error('Email failed to send. ' + err);
          return;
        }
        else {
          options.success(message);
          return;
        }
      });
    }
  );
};
