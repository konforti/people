exports = module.exports = function(req, res, opts) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!opts.action.value || opts.action.value.length < 1) {
      console.log('There is no value.');
      return;
    }

    if (opts.user._id === req.app.config.uid1) {
      console.log('You\'re not allowed to change this user roles.');
      return;
    }

    if (opts.user.isMemberOf('root')) {
      console.log('You may not change this role memberships.');
      return;
    }

    workflow.emit('setRoles');
  });

  workflow.on('setRoles', function () {
    var roles = opts.user.roles;

    if (opts.op === 'remove') {
      roles.forEach(function(role, i, arr) {
        var index = action.value.indexOf(role);
        if (index > -1) {
          roles.splice(index, 1);
        }
      });

      workflow.emit('patchMode', roles);
    }

    else if (opts.op === 'add') {
      req.app.db.models.Role.find().exec(function (err, allRoles) {
        if (err) {
          return console.log(err);
        }

        allRoles.forEach(function(roleItem, i, arr) {
          if (opts.action.value.indexOf(roleItem._id) > -1) {
            roles.push(opts.action.value);
          }
        });

        workflow.emit('patchMode', roles);
      });
    }
  });

  workflow.on('patchMode', function (roles) {
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

        return {user: updatedUser};
      });
    });
  });

  workflow.emit('validate');
};