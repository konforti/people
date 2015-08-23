'use strict';

exports = module.exports = function() {
  var middleware = function(req, res, next) {
    var hooks = req.hooks;

    req.app.db.models.Rule.getAll(function(err, rules) {
      if (err) {
        return console.error(err);
      }

      if (!rules) {
        return console.error('No Rules');
      }

      function checkConditions(conditions, user, callback) {
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

          callback(result);
        });
      }

      function doAction(rule, user) {
        rule.actions.forEach(function(action, index, array) {
          var opts = {action: action, user: user};
          switch (action.action) {
            case 'webhook':
              require('./actions/webhook')(req, event, user);
              break;

            case 'addRole':
              opts.op = 'add';
              require('./actions/addRemoveRole')(req, res, opts);
              break;

            case 'removeRole':
              opts.op = 'remove';
              require('./actions/addRemoveRole')(req, res, opts);
              break;

            case 'mode':
              opts.op = action.value;
              require('./actions/modeOnOff')(req, res, opts);
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

      return next();
    });
  };

  return middleware;
};
