'use strict';

/**
 *
 * @type {Function}
 */
exports = module.exports = function(app) {

  // Remote signup.
  app.post('/remote/signup/', require('../remote/index').signupRemote);

  // Remote login.
  app.post('/remote/login/', require('../remote/index').loginRemote);

  // Remote forgot.
  app.post('/remote/forgot/', require('../remote/forgot/index').forgotRemote);

  // Remote forgot.
  app.post('/remote/forgot/reset', require('../remote/forgot/index').forgotResetRemote);
};
