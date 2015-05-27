'use strict';

exports = module.exports = function(app, mongoose) {
  var settingsSchema = new mongoose.Schema({
    _id: { type: String },
    value: { type: String, default: '' }
  });
  settingsSchema.index({ value: 1 });
  settingsSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Settings', settingsSchema);

  settingsSchema.statics.varGet = function(id, done) {
    settingsSchema.findById(id).exec(function (err, param) {
      if (err) {
        if (typeof done === 'function') {
          return done(err);
        }
        return err;
      }

      if (typeof done === 'function') {
        return done(param);
      }
      return param;
    });
  };
};
