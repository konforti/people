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
  app.get('/remote/info/', require('./register/index').info);

  // Remote register.
  app.post('/remote/register/', require('./register/index').register);

  // Remote login.
  app.post('/remote/login/', require('./register/index').login);

  // Remote forgot.
  app.post('/remote/forgot/', require('./forgot/index').forgot);

  // Remote forgot.
  app.post('/remote/forgot/reset', require('./forgot/index').forgotReset);

  // Social register.
  app.post('/remote/register/social/', require('./social/index').registerSocial);

  app.get('/remote/register/twitter/', passport.authenticate('twitter', {callbackURL: '/remote/register/twitter/callback/'}));
  app.get('/remote/register/github/', passport.authenticate('github', {callbackURL: '/remote/register/github/callback/', scope: ['user:email']}));
  app.get('/remote/register/facebook/', passport.authenticate('facebook', {callbackURL: '/remote/register/facebook/callback/', scope: ['email']}));
  app.get('/remote/register/google/', passport.authenticate('google', {callbackURL: '/remote/register/google/callback/', scope: ['profile email']}));
  app.get('/remote/register/tumblr/', passport.authenticate('tumblr', {callbackURL: '/remote/register/tumblr/callback/'}));

  app.get('/remote/register/:social/callback/', require('./social/index').registerOauth);

  // Profile form.
  app.get('/remote/profile/', require('./profile/index').readProfile);
  app.post('/remote/profile/', require('./profile/index').updateProfile);
  app.post('/remote/password/', require('./profile/index').updatePassword);

  // Email verification.
  app.post('/remote/verification/', require('./verify/index').verification);
  app.get('/remote/verification/:token/', require('./verify/index').verify);

  // Social Connect.
  app.get('/remote/connect/twitter/', passport.authenticate('twitter', {callbackURL: '/remote/connect/twitter/callback/'}));
  app.get('/remote/connect/github/', passport.authenticate('github', {callbackURL: '/remote/connect/github/callback/'}));
  app.get('/remote/connect/facebook/', passport.authenticate('facebook', {callbackURL: '/remote/connect/facebook/callback/'}));
  app.get('/remote/connect/google/', passport.authenticate('google', {callbackURL: '/remote/connect/google/callback/', scope: ['profile email']}));
  app.get('/remote/connect/tumblr/', passport.authenticate('tumblr', {callbackURL: '/remote/connect/tumblr/callback/'}));

  app.get('/remote/connect/:social/callback/', require('./profile/index').connectOauth);

  // Social Disconnect.
  app.get('/remote/disconnect/:social/', require('./profile/index').disconnectOauth);
};
