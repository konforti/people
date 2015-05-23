'use strict';

exports = module.exports = function(app, mongoose) {
  var settingsSchema = new mongoose.Schema({
    _id: { type: String },
    value: { type: String, default: '' }
  });
  settingsSchema.index({ value: 1 });
  settingsSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Settings', settingsSchema);
};
