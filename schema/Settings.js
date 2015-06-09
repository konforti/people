'use strict';

exports = module.exports = function(app, mongoose) {
  var settingsSchema = new mongoose.Schema({
    _id: { type: String },
    value: { type: String, default: '' }
  });

  settingsSchema.statics.getParam = function(ids, done) {
    if (ids.constructor === Array) {
      return this.find({'_id': {$in: ids}}).exec(function (err, params) {
        var ret = {};
        for (var i = 0; i < params.length; i++) {
          ret[params[i]._id] = params[i].value;
        }

        return done(err, ret);
      });
    }
    else {
      return this.findById(ids).exec(function (err, param) {
        return done(err, param.value);
      });
    }
  };

  settingsSchema.statics.setParam = function(key, value, done) {
    this.findOneAndUpdate({_id: key}, {value: value}, {upsert: true}, function (err, param) {
      return done(err, param.value);
    });
  };

  settingsSchema.index({ value: 1 });
  settingsSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Settings', settingsSchema);
};
