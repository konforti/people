'use strict';

/**
 * unsaveUninitialized().
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
//function unsaveUninitialized(req, res, next) {
//  if (Object.keys(req.session.passport).length === 0) {
//    delete req.session.passport;
//  }
//
//  return next();
//}

/**
 *
 * @type {Function}
 */
exports = module.exports = function (app, passport) {

  // Prevent empty sessions store.
  //app.all('/remote*', unsaveUninitialized);

  // Remote info.
  app.get('/remote/info/', require('./signup/index').info);

  // Remote signup.
  app.post('/remote/signup/', require('./signup/index').signup);

  // Remote login.
  app.post('/remote/login/', require('./signup/index').login);

  // Remote forgot.
  app.post('/remote/forgot/', require('./forgot/index').forgot);

  // Remote forgot.
  app.post('/remote/forgot/reset', require('./forgot/index').forgotReset);

  // Social sign up.
  app.post('/remote/signup/social/', require('./social/index').signupSocial);

  app.get('/remote/signup/twitter/', passport.authenticate('twitter', {callbackURL: '/remote/signup/twitter/callback/'}));
  app.get('/remote/signup/twitter/callback/', require('./social/index').signupTwitter);

  app.get('/remote/signup/github/', passport.authenticate('github', {
    callbackURL: '/remote/signup/github/callback/',
    scope: ['user:email']
  }));
  app.get('/remote/signup/github/callback/', require('./social/index').signupGitHub);

  app.get('/remote/signup/facebook/', passport.authenticate('facebook', {
    callbackURL: '/remote/signup/facebook/callback/',
    scope: ['email']
  }));
  app.get('/remote/signup/facebook/callback/', require('./social/index').signupFacebook);

  app.get('/remote/signup/google/', passport.authenticate('google', {
    callbackURL: '/remote/signup/google/callback/',
    scope: ['profile email']
  }));
  app.get('/remote/signup/google/callback/', require('./social/index').signupGoogle);

  app.get('/remote/signup/tumblr/', passport.authenticate('tumblr', {callbackURL: '/remote/signup/tumblr/callback/'}));
  app.get('/remote/signup/tumblr/callback/', require('./social/index').signupTumblr);

  // Profile form.
  app.get('/remote/profile/', require('./profile/index').readProfile);
  app.post('/remote/profile/', require('./profile/index').updateProfile);
  app.post('/remote/password/', require('./profile/index').updatePassword);

  // Email verification.
  app.post('/remote/verification/', require('./verification/index').verification);
  app.get('/remote/verification/:token/', require('./verification/index').verify);

  // Social Connect.
  app.get('/remote/connect/twitter/', passport.authenticate('twitter', {callbackURL: '/remote/connect/twitter/callback/'}));
  app.get('/remote/connect/twitter/callback/', require('./profile/index').connectTwitter);
  app.get('/remote/connect/github/', passport.authenticate('github', {callbackURL: '/remote/connect/github/callback/'}));
  app.get('/remote/connect/github/callback/', require('./profile/index').connectGitHub);
  app.get('/remote/connect/facebook/', passport.authenticate('facebook', {callbackURL: '/remote/connect/facebook/callback/'}));
  app.get('/remote/connect/facebook/callback/', require('./profile/index').connectFacebook);
  app.get('/remote/connect/google/', passport.authenticate('google', {callbackURL: '/remote/connect/google/callback/', scope: ['profile email']}));
  app.get('/remote/connect/google/callback/', require('./profile/index').connectGoogle);
  app.get('/remote/connect/tumblr/', passport.authenticate('tumblr', {callbackURL: '/remote/connect/tumblr/callback/'}));
  app.get('/remote/connect/tumblr/callback/', require('./profile/index').connectTumblr);

  app.get('/remote/disconnect/twitter/', require('./profile/index').disconnectTwitter);
  app.get('/remote/disconnect/github/', require('./profile/index').disconnectGitHub);
  app.get('/remote/disconnect/facebook/', require('./profile/index').disconnectFacebook);
  app.get('/remote/disconnect/google/', require('./profile/index').disconnectGoogle);
  app.get('/remote/disconnect/tumblr/', require('./profile/index').disconnectTumblr);
};
