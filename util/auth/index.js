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
      var token;

      if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length === 2) {
          var scheme = parts[0];
          var creds = parts[1];
          if (/^Bearer$/i.test(scheme)) {
            token = creds;
          }
        }
      }
      else if (
        req.method === 'GET' &&
        req.cookies &&
        (req.cookies[req.app.locals.webJwtName] ||
        req.cookies[req.app.locals.remoteJwtName])
      ) {
        // Web links.
        token = req.cookies[req.app.locals.webJwtName];
      }

      if (!token) {
        return next();
      }

      workflow.emit('verifyJwt', token);
    });

    workflow.on('verifyJwt', function (token) {
      req.app.db.models.JwtSession.findOne({_id: token}, function (err, sess) {
        if (err) {
          return workflow.emit('exception', err);
        }

        jwt.verify(token, settings.cryptoKey, function(err, decoded) {
          if (err) {
            return workflow.emit('exception', err);
          }
          if (!decoded) {
            return next();
          }

          if (decoded.twostep === 'on') {
            req.twostepUser = decoded.id;
            return next();
          }

          if (!sess) {
            return next();
          }

          var iat = parseInt(decoded.iat);
          var exp = parseInt(settings.sessionExp);
          if (moment().utc().unix() >= iat + (exp / 10)) {
            if (moment().utc().unix() >= iat + exp) {
              // Expire.
              return next();
            }
            else {
              // Verify + Need refresh.
              workflow.emit('loadUser', decoded, sess, true);
            }
          }
          else {
            // Verify.
            workflow.emit('loadUser', decoded, sess);
          }
        });
      });
    });

    workflow.on('loadUser', function (decoded, sess, needRefresh) {
      req.app.db.models.User.findById(decoded.id, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }
        else if (!user) {
          return next();
        }

        else if (!needRefresh) {
          // Good to go!
          user.jwtSession = sess.id;
          req.user = user;
          return next();
        }
        else {
          // Need refresh.
          var payload = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            avatar: decoded.avatar
          };

          var newJwt = jwt.sign(payload, settings.cryptoKey);
          var fieldsToSet = {
            _id: newJwt,
            user: decoded.id,
            ua: sess.ua
          };

          req.app.db.models.JwtSession.remove({_id: sess.id});
          req.app.db.models.JwtSession.create(fieldsToSet, function (err, session) {
            if (err) {
              return workflow.emit('exception', err);
            }

            // Remote.
            res.set('JWTRefresh', newJwt);
            // Web.
            res.cookie('people.token', newJwt);

            user.jwtSession = newJwt;
            req.user = user;
            return next();
          });
        }
      });
    });

    workflow.emit('checkOptionsHeader');
  };

  return middleware;
};