'use strict';

exports = module.exports = function(app, passport) {
  var LocalStrategy = require('passport-local').Strategy,
      TwitterStrategy = require('passport-twitter').Strategy,
      GitHubStrategy = require('passport-github').Strategy,
      FacebookStrategy = require('passport-facebook').Strategy,
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
      TumblrStrategy = require('passport-tumblr').Strategy;

  var settings = app.db.models.Settings;

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

  if (settings.get('twitterKey')) {
    passport.use(new TwitterStrategy({
        consumerKey: settings.get('twitterKey'),
        consumerSecret: settings.get('twitterSecret')
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

  if (settings.get('githubKey')) {
    passport.use(new GitHubStrategy({
        clientID: settings.get('githubKey'),
        clientSecret: settings.get('githubSecret'),
        customHeaders: { "User-Agent": settings.get('projectName')}
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

  if (settings.get('facebookKey')) {
    passport.use(new FacebookStrategy({
        clientID: settings.get('facebookKey'),
        clientSecret: settings.get('facebookSecret')
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

  if (settings.get('googleKey')) {
    passport.use(new GoogleStrategy({
        clientID: settings.get('googleKey'),
        clientSecret: settings.get('googleSecret')
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

  if (settings.get('TumblrKey')) {
    passport.use(new TumblrStrategy({
        consumerKey: settings.get('TumblrKey'),
        consumerSecret: settings.get('TumblrSecret')
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
};
