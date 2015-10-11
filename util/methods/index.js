'use strict';

/**
 * setSession()
 * @param req
 * @param res
 * @param jwt
 * @param callback
 */
exports.setSession = function(req, res, jwt, callback) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    workflow.emit('setSession');
  });

  workflow.on('setSession', function () {
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
  });

  workflow.emit('validate');
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