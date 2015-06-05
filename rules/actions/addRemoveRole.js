exports = module.exports = function(req, op, action, user) {
  require('async').series([
    function(callback) {
      if (!action.value) {
        console.log('There is no value.');
        return;
      }

      if (user._id === req.app.config.uid1) {
        console.log('You\'re not allowed to change this user roles.');
        return;
      }

      if (user.isMemberOf('root')) {
        console.log('You may not change this role memberships.');
        return;
      }

      callback(null);
    },
    function(callback) {
      var roles = user.roles;

      if (op === 'remove') {
        var index = roles.indexOf(action.value);
        if (index > -1) {
          roles.splice(index, 1);
        }
      }

      else if (op === 'add') {
        req.app.db.models.Role.find().exec(function (err, oldRoles) {
          if (err) {
            return console.log(err);
          }

          roles.forEach(function(role, index, array) {
            if (oldRoles.indexOf(role) > -1) {
              roles.push(role);
            }
          });

        });

      }

      var fieldsToSet = {
        roles: roles
      };
      req.app.db.models.User.findByIdAndUpdate(user.id, fieldsToSet, function (err, updatedUser) {
        if (err) {
          return console.log(err);
        }

        updatedUser.populate('roles', 'name', function (err, updatedUser) {
          if (err) {
            return console.log(err);
          }

          callback(null, updatedUser);
        });
      });
    }
  ], function (err, result) {
    return result;
  });
}