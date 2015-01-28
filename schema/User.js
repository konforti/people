'use strict';

exports = module.exports = function(app, mongoose) {
  var userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: { type: String, unique: true },
    roles: [{ type: String, ref: 'Role' }],
    status: {
      id: { type: String, ref: 'Status' },
      name: { type: String, default: '' }
    },
    statusLog: [mongoose.modelSchemas.StatusLog],
    notes: [mongoose.modelSchemas.Note],
    isActive: String,
    isVerified: { type: String, default: '' },
    verificationToken: { type: String, default: '' },
    timeCreated: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    twitter: {},
    github: {},
    facebook: {},
    google: {},
    tumblr: {},
    search: [String]
  });
  userSchema.methods.defaultReturnUrl = function() {
    var returnUrl = '/';

    if (this.isMemberOf('root')) {
      returnUrl = '/admin/';
    }

    return returnUrl;
  };
  userSchema.statics.encryptResetToken = function(token, done) {
    var crypto = require('crypto');
    var hash = crypto.createHash('sha1').update(token).digest('hex');

    done(hash);
  };
  userSchema.statics.encryptPassword = function(password, done) {
    var bcrypt = require('bcrypt');
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return done(err);
      }

      bcrypt.hash(password, salt, function(err, hash) {
        done(err, hash);
      });
    });
  };
  userSchema.statics.validatePassword = function(password, hash, done) {
    var bcrypt = require('bcrypt');
    bcrypt.compare(password, hash, function(err, res) {
      done(err, res);
    });
  };

  userSchema.methods.hasPermissionTo = function(something) {
    //check role permissions
    var roleHasPermission = false;
    for (var i = 0 ; i < this.roles.length ; i++) {
      for (var j = 0 ; j < this.roles[i].permissions.length ; j++) {
        if (this.roles[i].permissions[j].name === something) {
          if (this.roles[i].permissions[j].permit) {
            roleHasPermission = true;
          }
        }
      }
    }

    return roleHasPermission;
  };
  userSchema.methods.isMemberOf = function(role) {
    for (var i = 0 ; i < this.roles.length ; i++) {
      if (this.roles[i]._id === role) {
        return true;
      }
    }

    return false;
  };
  userSchema.plugin(require('./plugins/pagedFind'));
  userSchema.index({ username: 1 }, { unique: true });
  userSchema.index({ email: 1 }, { unique: true });
  userSchema.index({ timeCreated: 1 });
  userSchema.index({ 'twitter.id': 1 });
  userSchema.index({ 'github.id': 1 });
  userSchema.index({ 'facebook.id': 1 });
  userSchema.index({ 'google.id': 1 });
  userSchema.index({ search: 1 });
  userSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('User', userSchema);
};
