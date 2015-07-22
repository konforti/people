exports = module.exports = function(req, res, opts) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!opts.action.value) {
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

    workflow.emit('patchMode');
  });

  workflow.on('patchMode', function () {
    var fieldsToSet = {
      mode: opts.op
    };

    req.app.db.models.User.findByIdAndUpdate(opts.user.id, fieldsToSet, function (err, updatedUser) {
      if (err) {
        return console.log(err);
      }

      return {user: updatedUser};
    });
  });

  workflow.emit('validate');
};