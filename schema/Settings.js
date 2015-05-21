'use strict';

exports = module.exports = function(app, mongoose) {
  var settingsSchema = new mongoose.Schema({
    key: { type: String, required: true },
    value: { type: String, default: '' }
  });
  settingsSchema.index({ key: 1 });
  settingsSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Settings', settingsSchema);
};
