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

  // userCreated event.
  rules.on('userCreated', function(user) {
    webhook(user);
  });

  // userLogin event.
  rules.on('userLogin', function(user) {
    webhook(user);
  });

  return rules;
};
