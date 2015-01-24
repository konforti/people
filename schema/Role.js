'use strict';

exports = module.exports = function(app, mongoose) {
  var roleSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    permissions: [{ name: String, permit: Boolean }]
  });
  roleSchema.plugin(require('./plugins/pagedFind'));
  roleSchema.index({ name: 1 }, { unique: true });
  roleSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Role', roleSchema);
};
