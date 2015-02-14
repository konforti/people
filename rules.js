'use strict';

exports = module.exports = function(req, res, next) {
  var rules = req.hooks;

  // afterUserCreated event.
  rules.on('afterUserCreated', function(user) {
    rules.webhook(user);
  });

  // afterUserLogin event.
  rules.on('afterUserLogin', function(user) {
    rules.webhook(user);
  });

  return rules;
};
