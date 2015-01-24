'use strict';

exports = module.exports = function(app, mongoose) {
  var statusSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  statusSchema.plugin(require('./plugins/pagedFind'));
  statusSchema.index({ name: 1 });
  statusSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Status', statusSchema);
};
