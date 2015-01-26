'use strict';

/**
 * Api Authentication.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function requireAuthentication(req, res, next) {
  if (!req.headers.authorization) {
    return res.json({ error: 'No credentials sent!' });
  }
  else {
    var encoded = req.headers.authorization.split(' ')[1];
    var decoded = new Buffer(encoded, 'base64').toString('utf8');

    if (decoded.split(':')[0] !== req.app.config.secret_key) {
      return res.json({ error: 'Wrong Key' });
    }
  }

  return next();
}

/**
 *
 * @type {Function}
 */
exports = module.exports = function(app) {

  // People
  // Require Authentication.
  app.all('/api/*', requireAuthentication);
  // List all users.
  app.get('/api/v1/people/', require('../rest/people').find);
  // Retrieve a user.
  app.get('/api/v1/people/:id', require('../rest/people').read);
  // Retrieve current user.
  app.get('/api/v1/people/current/:sid', require('../rest/people').readCurrent);
  // Update a User (isActive).
  app.put('/api/v1/people/:id/', require('../rest/people').update);
  // Add role to a user.
  app.post('/api/v1/people/:id/roles/', require('../rest/people').createRoles);
  // Remove role from a user.
  app.delete('/api/v1/people/:id/roles/:role', require('../rest/people').deleteRoles);

  // Roles
  // List all roles.
  app.get('/api/v1/roles/', require('../rest/roles').find);
  // Retrieve a role.
  app.get('/api/v1/roles/:rid', require('../rest/roles').read);
};
