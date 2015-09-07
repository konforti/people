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
      var conditions = { mode: 'on' };
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
          if (err) {console.log(err);
            return done(err);
          }

          if (!isValid) {console.log('Invalid password');
            return done(null, false, { message: 'Invalid password' });
          }

          return done(null, user);
        });
      });
    }
  ));

  var settings = app.getSettings();
  if (settings.twitterKey) {
    passport.use(new TwitterStrategy({
        consumerKey: settings.twitterKey,
        consumerSecret: settings.twitterSecret
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

  if (settings.githubKey) {
    passport.use(new GitHubStrategy({
        clientID: settings.githubKey,
        clientSecret: settings.githubSecret,
        customHeaders: { "User-Agent": settings.projectName}
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

  if (settings.facebookKey) {
    passport.use(new FacebookStrategy({
        clientID: settings.facebookKey,
        clientSecret: settings.facebookSecret
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

  if (settings.googleKey) {
    passport.use(new GoogleStrategy({
        clientID: settings.googleKey,
        clientSecret: settings.googleSecret
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

  if (settings.tumblrKey) {
    passport.use(new TumblrStrategy({
        consumerKey: settings.tumblrKey,
        consumerSecret: settings.tumblrKey
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
