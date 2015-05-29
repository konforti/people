'use strict';

exports = module.exports = function(app, passport) {
  var LocalStrategy = require('passport-local').Strategy,
      TwitterStrategy = require('passport-twitter').Strategy,
      GitHubStrategy = require('passport-github').Strategy,
      FacebookStrategy = require('passport-facebook').Strategy,
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
      TumblrStrategy = require('passport-tumblr').Strategy;

  passport.use(new LocalStrategy(
    function(username, password, done) {
      var conditions = { isActive: 'yes' };
      if (username.indexOf('@') === -1) {
        conditions.username = username;
      }
      else {
        conditions.email = username;
      }

      app.db.models.User.findOne(conditions, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }

        app.db.models.User.validatePassword(password, user.password, function(err, isValid) {
          if (err) {
            return done(err);
          }

          if (!isValid) {
            return done(null, false, { message: 'Invalid password' });
          }

          return done(null, user);
        });
      });
    }
  ));

  app.db.models.Settings.getParam(['twitterKey', 'githubKey', 'facebookKey', 'googleKey', 'tumblrKey', 'twitterSecret', 'githubSecret', 'facebookSecret', 'googleSecret', 'tumblrSecret', 'projectName'], function(err, params) {
    if (params.twitterKey) {
      passport.use(new TwitterStrategy({
          consumerKey: params.twitterKey,
          consumerSecret: params.twitterSecret
        },
        function(token, tokenSecret, profile, done) {
          done(null, false, {
            token: token,
            tokenSecret: tokenSecret,
            profile: profile
          });
        }
      ));
    }

    if (params.githubKey) {
      passport.use(new GitHubStrategy({
          clientID: params.githubKey,
          clientSecret: params.githubSecret,
          customHeaders: { "User-Agent": params.projectName}
        },
        function(accessToken, refreshToken, profile, done) {
          done(null, false, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
          });
        }
      ));
    }

    if (params.facebookKey) {
      passport.use(new FacebookStrategy({
          clientID: params.facebookKey,
          clientSecret: params.facebookSecret
        },
        function(accessToken, refreshToken, profile, done) {
          done(null, false, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
          });
        }
      ));
    }

    if (params.googleKey) {
      passport.use(new GoogleStrategy({
          clientID: params.googleKey,
          clientSecret: params.googleSecret
        },
        function(accessToken, refreshToken, profile, done) {
          done(null, false, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
          });
        }
      ));
    }

    if (params.tumblrKey) {
      passport.use(new TumblrStrategy({
          consumerKey: params.tumblrKey,
          consumerSecret: params.tumblrKey
        },
        function(token, tokenSecret, profile, done) {
          done(null, false, {
            token: token,
            tokenSecret: tokenSecret,
            profile: profile
          });
        }
      ));
    }

    passport.serializeUser(function(user, done) {
      done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
      app.db.models.User.findOne({ _id: id }).exec(function(err, user) {
        if (user) {
          user.populate("roles", function(err, admin) {
            done(err, user);
          });
        }
        else {
          done(err, user);
        }
      });
    });
  });
};
