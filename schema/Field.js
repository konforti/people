'use strict';

exports = module.exports = function(app, mongoose) {
  var FieldSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' }
  });

  FieldSchema.statics.getAll = function(done) {
    this.find({}, 'name').sort('name').exec(function (err, fields) {
      return done(err, fields);
    });
  };

  FieldSchema.plugin(require('./plugins/pagedFind'));
  FieldSchema.index({ name: 1 }, { unique: true });
  FieldSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Field', FieldSchema);
};
