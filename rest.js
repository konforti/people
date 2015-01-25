'use strict';

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

function ensureAdmin(req, res, next) {
  if (req.user.isMemberOf('root')) {
    return next();
  }
  res.redirect('/');
}


exports = module.exports = function(app, passport) {

  // People
  // List all users.
  app.get('/api/v1/people/', require('./rest/people').find);
  // Retrieve a user.
  app.get('/api/v1/people/:id', require('./rest/people').read);
  // Retrieve current user.
  app.get('/api/v1/people/current/:sid', require('./rest/people').readCurrent);
  // Update a User (isActive).
  app.put('/api/v1/people/:id/', require('./rest/people').update);
  // Add role to a user.
  app.post('/api/v1/people/:id/roles/', require('./rest/people').createRoles);
  // Remove role from a user.
  app.delete('/api/v1/people/:id/roles/:role', require('./rest/people').deleteRoles);

  // Roles
  // List all roles.
  app.get('/api/v1/roles/', require('./rest/roles').find);
  // Retrieve a role.
  app.get('/api/v1/roles/:rid', require('./rest/roles').read);
};
