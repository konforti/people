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
  app.get('/api/v1/people/', require('./rest/people').find);
  app.get('/api/v1/people/:uid', require('./rest/people').read);
  app.put('/api/v1/people/:uid/', require('./rest/people').update);

  app.post('/api/v1/people/:uid/roles/', require('./rest/people').createRoles);
  app.delete('/api/v1/people/:uid/roles/:rid', require('./rest/people').deleteRoles);

  // Roles
  app.get('/api/v1/roles/', require('./rest/roles').find);
  app.get('/api/v1/roles/:rid', require('./rest/roles').read);
};
