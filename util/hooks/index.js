'use strict';

var request = require('request');

exports = module.exports = function(req, res, next) {
  var hooks = new (require('events').EventEmitter)();

  var settings = req.app.getSettings();
  hooks.webhook = function(payload) {
    if (param) {
      var options = {
        uri: settings.webhooksURL,
        method: 'POST',
        json: JSON.stringify(payload)
      };
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log('webhook success');
        }
      });
    }
  };

  hooks.log = [];

  hooks.on('exception', function(err) {
    hooks.log.push(new Date() + '-Exception: '+ err);
    return hooks.emit('action');
  });

  hooks.on('action', function() {
    //
  });

  return hooks;
};
