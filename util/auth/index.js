'use strict';

var jwt = require('jsonwebtoken');
var moment = require('moment');
var crypto = require('crypto');

exports = module.exports = function() {
  var middleware = function(req, res, next) {
    var workflow = req.app.utility.workflow(req, res);
    var settings = req.app.getSettings();
    res.set('Access-Control-Expose-Headers', 'JWTRefresh');

    workflow.on('checkOptionsHeader', function () {
      if (req.method === 'OPTIONS' && req.headers.hasOwnProperty('access-control-request-headers')) {
        return workflow.emit('response');
      }

      else {
        workflow.emit('CheckJwtExist');
      }
    });

    workflow.on('CheckJwtExist', function () {
      if (!req.headers || !req.headers.authorization) {
        return next();
      }

      var parts = req.headers.authorization.split(' ');
      if (parts.length !== 2) {
        return next();
      }

      var scheme = parts[0];
      var credentials = parts[1];
      if (!/^Bearer$/i.test(scheme)) {
        return next();
      }

      workflow.emit('verifyJwt', credentials);
    });

    workflow.on('verifyJwt', function (credentials) {
      jwt.verify(credentials, settings.cryptoKey, function(err, decoded) {
        if (err ) {
          return next(err);
        }
        if (!decoded) {
          return next('Not verify.');
        }

        var iat = parseInt(decoded.iat);
        var exp = parseInt(settings.sessionExp);
        if (moment().utc().unix() >= iat + (exp / 10)) {
          if (moment().utc().unix() >= iat + exp) {
            // Expire.
            return next('JWT Expire.');
          }
          else {
            // Verify + Need refresh.
            workflow.emit('loadUser', decoded, true);
          }
        }
        else {
          // Verify.
          workflow.emit('loadUser', decoded);
        }
      });
    });

    workflow.on('loadUser', function (decoded, refreshJwt) {
      req.app.db.models.User.findById(decoded.id, function (err, user) {
        if (err) {
          return next(err);
        }
        if (!user) {
          return next('No User.');
        }

        if (refreshJwt) {
          var gravatarHash = crypto.createHash('md5').update(user.email).digest('hex');

          var payload = {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar: 'https://secure.gravatar.com/avatar/' + gravatarHash + '?d=mm&s=100&r=g'
          };

          res.set('JWTRefresh', jwt.sign(payload, settings.cryptoKey));
        }

        req.user = user;
        return next();
      });
    });

    workflow.emit('checkOptionsHeader');
  };

  return middleware;
};