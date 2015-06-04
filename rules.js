'use strict';

exports = module.exports = function(req, res, next) {
  var rules = req.hooks;

  req.app.db.models.Rule.find({}, function(err, rules) {
    if (err) {
      return console.log(err);
    }

    if (!rules) {
      return console.log('No Rules');
    }

    console.log(rules);

    for(var i = 0; i < rules.length; i++) {
      rules.on(rules[i].event, function(user) {
        if ()

        rules.webhook(user);
      });
    }
  });

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
