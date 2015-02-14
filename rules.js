'use strict';

exports = module.exports = function(req, res, next) {
  var request = require('request');
  var rules = req.hooks;
  var webhooksURL =  req.app.config.webhooksURL;
  var webhook = function(payload) {
    if (webhooksURL) {
      var options = {
        uri: webhooksURL,
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

  // afterUserCreated event.
  rules.on('afterUserCreated', function(user) {
    webhook(user);
  });

  // afterUserLogin event.
  rules.on('afterUserLogin', function(user) {
    webhook(user);
  });

  return rules;
};
