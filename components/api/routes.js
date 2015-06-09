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
    return res.json({error: 'No credentials sent!'});
  }
  else {
    var encoded = req.headers.authorization.split(' ')[1];
    var decoded = new Buffer(encoded, 'base64').toString('utf8');

    var settings = req.app.getSettings();
    if (decoded.split(':')[0] !== settings.secretKey) {
      return res.json({error: 'Wrong Key'});
    }
  }

  return next();
}

/**
 * unsaveUninitialized().
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function unsaveUninitialized(req, res, next) {
  if (Object.keys(req.session.passport).length === 0) {
    delete req.session.passport;
  }

  return next();
}

/**
 *
 * @type {Function}
 */
exports = module.exports = function (app) {

  // Prevent empty sessions store.
  app.all('/api/*', unsaveUninitialized);

  // People.
  // Require Authentication.
  app.all('/api/*', requireAuthentication);
  // List all users.
  app.get('/api/v1/persons/', require('./persons').find);
  // Retrieve current user.
  app.get('/api/v1/persons/current/:sid/', require('./persons').readCurrent);
  // Retrieve a user.
  app.get('/api/v1/persons/:id/', require('./persons').read);
  // Update a User (mode).
  app.put('/api/v1/persons/:id/', require('./persons').update);
  // Assign role to a user.
  app.post('/api/v1/persons/:id/roles/', require('./persons').createRoles);
  // Remove role from a user.
  app.delete('/api/v1/persons/:id/roles/:role', require('./persons').deleteRoles);

  // Roles.
  // List all roles.
  app.get('/api/v1/roles/', require('./roles').find);
  // Retrieve a role.
  app.get('/api/v1/roles/:rid/', require('./roles').read);
};
