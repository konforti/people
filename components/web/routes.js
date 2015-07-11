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

  // Register.
  app.get('/register/', require('./register/index').init);
  app.post('/register/', require('./register/index').register);

  // Social register.
  app.post('/register/social/', require('./social/index').registerSocial);

  app.get('/register/twitter/', passport.authenticate('twitter', {callbackURL: '/register/twitter/callback/'}));
  app.get('/register/github/', passport.authenticate('github', {callbackURL: '/register/github/callback/', scope: ['user:email']}));
  app.get('/register/facebook/', passport.authenticate('facebook', {callbackURL: '/register/facebook/callback/', scope: ['email']}));
  app.get('/register/google/', passport.authenticate('google', {callbackURL: '/register/google/callback/', scope: ['profile email']}));
  app.get('/register/tumblr/', passport.authenticate('tumblr', {callbackURL: '/register/tumblr/callback/'}));

  app.get('/register/:social/callback/', require('./social/index').registerOauth);

  // Login/out.
  app.get('/login/', require('./login/index').init);
  app.post('/login/', require('./login/index').login);
  app.get('/login/forgot/', require('./login/forgot/index').init);
  app.post('/login/forgot/', require('./login/forgot/index').send);
  app.get('/login/reset/', require('./login/reset/index').init);
  app.get('/login/reset/:email/:token/', require('./login/reset/index').init);
  app.put('/login/reset/:email/:token/', require('./login/reset/index').set);
  app.get('/logout/', require('./logout/index').init);

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

  // Admin > Emails.
  app.get('/admin/emails/', require('./admin/emails/index').read);
  app.get('/admin/emails/test', require('./admin/emails/index').test);
  app.put('/admin/emails/', require('./admin/emails/index').update);
  app.post('/admin/emails/', require('./admin/emails/index').update);

  // Admin > Search.
  app.get('/admin/search/', require('./admin/search/index').find);

  // Account.
  app.all('/account*', ensureAuthenticated);
  app.get('/account/', require('./account/index').init);
  app.put('/account/', require('./account/index').update);
  app.post('/account/', require('./account/index').update);
  app.put('/account/password/', require('./account/index').password);
  app.delete('/account/', require('./account/index').delete);

  // Account connect.
  app.get('/account/twitter/', passport.authenticate('twitter', {callbackURL: '/account/twitter/callback/'}));
  app.get('/account/github/', passport.authenticate('github', {callbackURL: '/account/github/callback/'}));
  app.get('/account/facebook/', passport.authenticate('facebook', {callbackURL: '/account/facebook/callback/'}));
  app.get('/account/google/', passport.authenticate('google', {callbackURL: '/account/google/callback/', scope: ['profile email']}));
  app.get('/account/tumblr/', passport.authenticate('tumblr', {callbackURL: '/account/tumblr/callback/'}));

  app.get('/account/:social/callback/', require('./account/index').connectOauth);

  // Account disconnect.
  app.get('/account/:social/disconnect/', require('./account/index').disconnectOauth);

  // Account > Verification.
  app.get('/account/verify/', require('./account/verify/index').init);
  app.post('/account/verify/', require('./account/verify/index').resendVerification);
  app.get('/account/verify/:token/', require('./account/verify/index').verify);

  // Route not found.
  app.all('*', require('./http/index').http404);
};
