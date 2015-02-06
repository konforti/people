'use strict';

/**
 * unsaveUninitialized().
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function unsaveUninitialized(req, res, next) {
  if (req.url.indexOf('/remote/login/') !== 0 && req.url.indexOf('/remote/signup/') !== 0) {
    if (Object.keys(req.session.passport).length === 0) {
      delete req.session.passport;
    }
  }

  return next();
}

/**
 *
 * @type {Function}
 */
exports = module.exports = function(app, passport) {

  // Prevent empty sessions store.
  //app.all('/remote*', unsaveUninitialized);

  // Remote info.
  app.get('/remote/info/', require('./index').info);

  // Remote signup.
  app.post('/remote/signup/', require('./index').signup);

  // Remote login.
  app.post('/remote/login/', require('./index').login);

  // Remote forgot.
  app.post('/remote/forgot/', require('./forgot/index').forgot);

  // Remote forgot.
  app.post('/remote/forgot/reset', require('./forgot/index').forgotReset);

  // Social sign up.
  app.post('/remote/signup/social/', require('./index').signupSocial);

  app.get('/remote/signup/twitter/', passport.authenticate('twitter', { callbackURL: '/remote/signup/twitter/callback/' }));
  app.get('/remote/signup/twitter/callback/', require('./index').signupTwitter);

  app.get('/remote/signup/github/', passport.authenticate('github', { callbackURL: '/remote/signup/github/callback/', scope: ['user:email'] }));
  app.get('/remote/signup/github/callback/', require('./index').signupGitHub);

  app.get('/remote/signup/facebook/', passport.authenticate('facebook', { callbackURL: '/remote/signup/facebook/callback/', scope: ['email'] }));
  app.get('/remote/signup/facebook/callback/', require('./index').signupFacebook);

  app.get('/remote/signup/google/', passport.authenticate('google', { callbackURL: '/remote/signup/google/callback/', scope: ['profile email'] }));
  app.get('/remote/signup/google/callback/', require('./index').signupGoogle);

  app.get('/remote/signup/tumblr/', passport.authenticate('tumblr', { callbackURL: '/remote/signup/tumblr/callback/' }));
  app.get('/remote/signup/tumblr/callback/', require('./index').signupTumblr);

  // Profile form.
  app.get('/remote/profile/', require('./index').readProfile);
  app.post('/remote/profile/', require('./index').updateProfile);


};
