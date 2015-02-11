'use strict';

exports = module.exports = function(req, res, next) {
  var hooks = new (require('events').EventEmitter)();

  hooks.log = [];

  hooks.on('exception', function(err) {
    hooks.log.push(new Date() + '-Exception: '+ err);
    return hooks.emit('action');
  });

  hooks.on('action', function() {
    //
  });

  return hooks;
};
