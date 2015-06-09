exports = module.exports = function(req, op, action, user) {
  require('async').waterfall([
    /**
     * verify
     * @param callback
     */
    function(callback) {
      if (!action.value || action.value.length < 1) {
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

    /**
     * Set roles
     * @param callback
     */
    function(callback) {
      var roles = user.roles;

      if (op === 'remove') {
        roles.forEach(function(role, i, arr) {
          var index = action.value.indexOf(role);
          if (index > -1) {
            roles.splice(index, 1);
          }
        });

        callback(null, roles);
      }

      else if (op === 'add') {
        req.app.db.models.Role.find().exec(function (err, allRoles) {
          if (err) {
            return console.log(err);
          }

          allRoles.forEach(function(roleItem, i, arr) {
            if (action.value.indexOf(roleItem._id) > -1) {
              roles.push(action.value);
            }
          });

          callback(null, roles);
        });
      }
    },

    /**
     * Patch roles
     * @param callback
     */
    function(roles, callback) {
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
    return {user: result};
  });
};