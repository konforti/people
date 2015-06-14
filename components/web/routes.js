'use strict';

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
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

/**
 * Ensure Admin.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function ensureAdmin(req, res, next) {
  if (req.user.isMemberOf('root')) {
    return next();
  }
  res.redirect('/');
}


/**
 * Web router.
 * @type {Function}
 */
exports = module.exports = function (app, passport) {
  // Front end.
  app.get('/', require('./index').init);
  app.get('/about/', require('./about/index').init);

  // Sign up.
  app.get('/signup/', require('./signup/index').init);
  app.post('/signup/', require('./signup/index').signup);

  // Social sign up.
  app.post('/signup/social/', require('./signup/index').signupSocial);
  app.get('/signup/twitter/', passport.authenticate('twitter', {callbackURL: '/signup/twitter/callback/'}));
  app.get('/signup/twitter/callback/', require('./signup/index').signupTwitter);
  app.get('/signup/github/', passport.authenticate('github', {
    callbackURL: '/signup/github/callback/',
    scope: ['user:email']
  }));
  app.get('/signup/github/callback/', require('./signup/index').signupGitHub);
  app.get('/signup/facebook/', passport.authenticate('facebook', {
    callbackURL: '/signup/facebook/callback/',
    scope: ['email']
  }));
  app.get('/signup/facebook/callback/', require('./signup/index').signupFacebook);

  app.get('/signup/google/', passport.authenticate('google', {
    callbackURL: '/signup/google/callback/',
    scope: ['profile email']
  }));
  app.get('/signup/google/callback/', require('./signup/index').signupGoogle);
  app.get('/signup/tumblr/', passport.authenticate('tumblr', {callbackURL: '/signup/tumblr/callback/'}));
  app.get('/signup/tumblr/callback/', require('./signup/index').signupTumblr);

  // Login/out.
  app.get('/login/', require('./login/index').init);
  app.post('/login/', require('./login/index').login);
  app.get('/login/forgot/', require('./login/forgot/index').init);
  app.post('/login/forgot/', require('./login/forgot/index').send);
  app.get('/login/reset/', require('./login/reset/index').init);
  app.get('/login/reset/:email/:token/', require('./login/reset/index').init);
  app.put('/login/reset/:email/:token/', require('./login/reset/index').set);
  app.get('/logout/', require('./logout/index').init);

  // Social login.
  app.get('/login/twitter/', passport.authenticate('twitter', {callbackURL: '/login/twitter/callback/'}));
  app.get('/login/twitter/callback/', require('./login/index').loginTwitter);
  app.get('/login/github/', passport.authenticate('github', {callbackURL: '/login/github/callback/'}));
  app.get('/login/github/callback/', require('./login/index').loginGitHub);
  app.get('/login/facebook/', passport.authenticate('facebook', {callbackURL: '/login/facebook/callback/'}));
  app.get('/login/facebook/callback/', require('./login/index').loginFacebook);
  app.get('/login/google/', passport.authenticate('google', {
    callbackURL: '/login/google/callback/',
    scope: ['profile email']
  }));
  app.get('/login/google/callback/', require('./login/index').loginGoogle);
  app.get('/login/tumblr/', passport.authenticate('tumblr', {
    callbackURL: '/login/tumblr/callback/',
    scope: ['profile email']
  }));
  app.get('/login/tumblr/callback/', require('./login/index').loginTumblr);

  // Admin.
  app.all('/admin*', ensureAuthenticated);
  app.all('/admin*', ensureAdmin);
  app.get('/admin/', require('./admin/index').init);

  // Admin > Users.
  app.get('/admin/users/', require('./admin/users/index').find);
  app.post('/admin/users/', require('./admin/users/index').create);
  app.get('/admin/users/:id/', require('./admin/users/index').read);
  app.put('/admin/users/:id/', require('./admin/users/index').update);
  app.put('/admin/users/:id/password/', require('./admin/users/index').password);
  app.put('/admin/users/:id/roles/', require('./admin/users/index').roles);
  app.delete('/admin/users/:id/', require('./admin/users/index').delete);
  app.post('/admin/users/:id/notes/', require('./admin/users/index').newNote);
  app.post('/admin/users/:id/status/', require('./admin/users/index').newStatus);

  // Admin > Fields.
  app.get('/admin/fields/', require('./admin/fields/index').find);
  app.post('/admin/fields/', require('./admin/fields/index').create);
  app.get('/admin/fields/:id/', require('./admin/fields/index').read);
  app.put('/admin/fields/:id/', require('./admin/fields/index').update);
  app.delete('/admin/fields/:id/', require('./admin/fields/index').delete);

  // Admin > Rules.
  app.get('/admin/rules/', require('./admin/rules/index').find);
  app.post('/admin/rules/', require('./admin/rules/index').create);
  app.get('/admin/rules/:id/', require('./admin/rules/index').read);
  app.put('/admin/rules/:id/', require('./admin/rules/index').update);
  app.post('/admin/rules/:id/', require('./admin/rules/index').update);
  app.delete('/admin/rules/:id/', require('./admin/rules/index').delete);

  // Admin > Roles.
  app.get('/admin/roles/', require('./admin/roles/index').find);
  app.post('/admin/roles/', require('./admin/roles/index').create);
  app.get('/admin/roles/:id/', require('./admin/roles/index').read);
  app.put('/admin/roles/:id/', require('./admin/roles/index').update);
  app.put('/admin/roles/:id/permissions/', require('./admin/roles/index').permissions);
  app.delete('/admin/roles/:id/', require('./admin/roles/index').delete);

  // Admin > Statuses.
  app.get('/admin/statuses/', require('./admin/statuses/index').find);
  app.post('/admin/statuses/', require('./admin/statuses/index').create);
  app.get('/admin/statuses/:id/', require('./admin/statuses/index').read);
  app.put('/admin/statuses/:id/', require('./admin/statuses/index').update);
  app.delete('/admin/statuses/:id/', require('./admin/statuses/index').delete);

  // Admin > Settings.
  app.get('/admin/settings/', require('./admin/settings/index').read);
  app.put('/admin/settings/', require('./admin/settings/index').update);
  app.post('/admin/settings/', require('./admin/settings/index').update);
  app.put('/admin/settings/reset', require('./admin/settings/index').reset);
  app.post('/admin/settings/reset', require('./admin/settings/index').reset);

  // Admin > Search.
  app.get('/admin/search/', require('./admin/search/index').find);

  // Account.
  app.all('/account*', ensureAuthenticated);
  app.get('/account/', require('./account/index').init);
  app.put('/account/', require('./account/index').update);
  app.post('/account/', require('./account/index').update);
  app.put('/account/password/', require('./account/index').password);
  app.delete('/account/', require('./account/index').delete);

  // Account > Settings > Social.
  app.get('/account/twitter/', passport.authenticate('twitter', {callbackURL: '/account/twitter/callback/'}));
  app.get('/account/twitter/callback/', require('./account/index').connectTwitter);
  app.get('/account/twitter/disconnect/', require('./account/index').disconnectTwitter);
  app.get('/account/github/', passport.authenticate('github', {callbackURL: '/account/github/callback/'}));
  app.get('/account/github/callback/', require('./account/index').connectGitHub);
  app.get('/account/github/disconnect/', require('./account/index').disconnectGitHub);
  app.get('/account/facebook/', passport.authenticate('facebook', {callbackURL: '/account/facebook/callback/'}));
  app.get('/account/facebook/callback/', require('./account/index').connectFacebook);
  app.get('/account/facebook/disconnect/', require('./account/index').disconnectFacebook);
  app.get('/account/google/', passport.authenticate('google', {
    callbackURL: '/account/google/callback/',
    scope: ['profile email']
  }));
  app.get('/account/google/callback/', require('./account/index').connectGoogle);
  app.get('/account/google/disconnect/', require('./account/index').disconnectGoogle);
  app.get('/account/tumblr/', passport.authenticate('tumblr', {callbackURL: '/account/tumblr/callback/'}));
  app.get('/account/tumblr/callback/', require('./account/index').connectTumblr);
  app.get('/account/tumblr/disconnect/', require('./account/index').disconnectTumblr);

  // Account > Verification.
  app.get('/account/verification/', require('./account/verification/index').init);
  app.post('/account/verification/', require('./account/verification/index').resendVerification);
  app.get('/account/verification/:token/', require('./account/verification/index').verify);

  // Route not found.
  app.all('*', require('./http/index').http404);
};
