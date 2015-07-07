'use strict';

/**
 * authentication().
 * @param req
 * @param res
 * @param next
 */
function authentication(req, res, next) {
  var settings = req.app.getSettings();
  var jwt = require('jsonwebtoken');
  if ((req.body && req.body.jwt) || (req.query && req.query.jwt)) {
    var token = (req.body && req.body.jwt) || (req.query && req.query.jwt);

    jwt.verify(token, settings.cryptoKey, function(err, decoded) {
      if (err || !decoded) {
        res.set('X-Auth-Required', 'true');
        return next();
      }

      req.app.db.models.User.findById(decoded.id, function (err, user) {
        if (err || !user) {
          return next();
        }

        req.user = user;
        return next();
      });
    });
  }
  else {
    return next();
  }

}

/**
 * Ensure Authenticated.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.send({errors: ['403 Forbidden']});
}

/**
 *
 * @type {Function}
 */
exports = module.exports = function (app, passport) {
  // Authentication.
  app.all('/remote*', authentication);

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

  // Authenticated users.
  app.all('/remote/profile*', ensureAuthenticated);
  app.all('/remote/password*', ensureAuthenticated);
  app.all('/remote/twostepn*', ensureAuthenticated);
  app.all('/remote/verify*', ensureAuthenticated);
  app.all('/remote/connect*', ensureAuthenticated);

  // Profile form.
  app.get('/remote/profile/', require('./profile/index').readProfile);
  app.post('/remote/profile/', require('./profile/index').updateProfile);
  app.post('/remote/password/', require('./profile/index').updatePassword);

  // 2 step
  app.post('/remote/twostepn/', require('./profile/index').twostep);

  // Email verification.
  app.post('/remote/verify/', require('./verify/index').verification);
  app.get('/remote/verify/:token/', require('./verify/index').verify);

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
