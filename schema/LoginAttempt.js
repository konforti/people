'use strict';

exports = module.exports = function(app, mongoose) {
  var settings = app.getSettings();
  var attemptSchema = new mongoose.Schema({
    ip: { type: String, default: '' },
    user: { type: String, default: '' },
    time: { type: Date, default: Date.now, expires: parseInt(settings.loginAttemptsExp) }
  });
  attemptSchema.index({ ip: 1 });
  attemptSchema.index({ user: 1 });
  attemptSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('LoginAttempt', attemptSchema);
};
