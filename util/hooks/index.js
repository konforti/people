'use strict';

var request = require('request');

exports = module.exports = function(req, res, next) {
  var hooks = new (require('events').EventEmitter)();

  req.app.db.models.Settings.getParam('webhooksURL', function(err, param) {
    hooks.webhook = function(payload) {
      if (param) {
        var options = {
          uri: param,
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
  });

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
