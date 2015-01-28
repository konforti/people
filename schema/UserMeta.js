'use strict';

exports = module.exports = function(app, mongoose) {
  var userMetaSchema = new mongoose.Schema({
    user: { type: String, ref: 'User' },
    key: { type: String, required: true },
    value: { type: String, default: '' }
  });
  userMetaSchema.plugin(require('./plugins/pagedFind'));
  userMetaSchema.index({ user: 1 });
  userMetaSchema.index({ key: 1 });
  userMetaSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('UserMeta', userMetaSchema);
};
