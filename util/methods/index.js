'use strict';

/**
 * setSession()
 * @param req
 * @param jwt
 * @param callback
 */
exports.setSession = function(req, jwt, callback) {
  var ua = require('useragent').parse(req.headers['user-agent']);
  var fieldsToSet = {
    _id: jwt,
    user: req.user.id,
    ip: req.ip,
    ua: {
      browser: ua.family,
      os: ua.os.family,
      device: ua.device.family
    }
  };

  req.app.db.models.JwtSession.create(fieldsToSet, function (err, sess) {
    if (err) {
      return callback(err);
    }

    return callback();
  });
};

/**
 * setJwt()
 * @param user
 * @returns {*}
 */
exports.setJwt = function(user, key) {
  var jwt = require('jsonwebtoken');
  var payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar || '',
    twostep: user.twostep || 'off'
  };

  return jwt.sign(payload, key);
};