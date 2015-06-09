'use strict';

exports = module.exports = function(req, res, next) {
  var hooks = req.hooks;

  req.app.db.models.Rule.getAll(function(err, rules) {
    if (err) {
      return console.log(err);
    }

    if (!rules) {
      return console.log('No Rules');
    }

    function checkConditions(conditions, user, next) {
      var result = 0;
      conditions.forEach(function(condition, index, array) {
        if (condition.operator === 'is') {
          if (condition.match.indexOf(user[condition.condition]) > -1) {
            result ++;
          }
        }
        else if (condition.operator === 'isNot') {
          if (condition.match.indexOf(user[condition.condition]) === -1) {
            result ++;
          }
        }

        next(result);
      });
    }



    function doAction(rule, user) {
      rule.actions.forEach(function(action, index, array) {
        switch (action.action) {
          case 'webhook':
            require('./actions/webhook')(req, event, user);
            break;

          case 'addRole':
            require('./actions/addRemoveRole')(req, 'add', action, user);
            break;

          case 'removeRole':
            require('./actions/addRemoveRole')(req, 'remove', action, user);
            break;

          case 'active':
            require('./actions/modeOnOff')(req, 'on', action, user);
            break;

          case 'inActive':
            require('./actions/modeOnOff')(req, 'off', action, user);
            break;
        }
      });

    }

    rules.forEach(function(rule, index, array) {
      hooks.on(rule.event, function(user) {
        checkConditions(rule.conditions, user, function(result) {
          if (rule.and_or === 'all' && result === rule.conditions.length
            ||
            rule.and_or === 'any' && result > 0)
          {
            doAction(rule, user);
          }
        });
      });
    });
  });

  return hooks;
};
