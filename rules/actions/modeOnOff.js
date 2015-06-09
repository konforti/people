exports = module.exports = function(req, op, action, user) {console.log(op);
  require('async').series([
    /**
     * verify
     * @param callback
     */
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

    /**
     * Patch mode
     * @param callback
     */
    function(callback) {
      var fieldsToSet = {
        mode: op
      };

      req.app.db.models.User.findByIdAndUpdate(user.id, fieldsToSet, function (err, updatedUser) {
        if (err) {
          return console.log(err);
        }

        callback(null, updatedUser);
      });
    }
  ], function (err, result) {
    return {user: result};
  });
};