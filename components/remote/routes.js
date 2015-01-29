'use strict';

/**
 *
 * @type {Function}
 */
exports = module.exports = function(app) {

  // Remote signup.
  app.post('/remote/signup/', require('./index').signupRemote);

  // Remote login.
  app.post('/remote/login/', require('./index').loginRemote);

  // Remote forgot.
  app.post('/remote/forgot/', require('./forgot/index').forgotRemote);

  // Remote forgot.
  app.post('/remote/forgot/reset', require('./forgot/index').forgotResetRemote);
};
