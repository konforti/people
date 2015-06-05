'use strict';

exports = module.exports = function(app, mongoose) {
  var RuleSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    event: { type: String, default: '' },
    and_or: { type: String, default: '' },
    conditions: { type: Array, default: [] },
    actions: { type: Array, default: [] }
  });

  RuleSchema.statics.getAll = function(done) {
    this.find().sort('name').exec(function (err, rules) {
      return done(err, rules);
    });
  };

  RuleSchema.plugin(require('./plugins/pagedFind'));
  RuleSchema.index({ ON: 1 });
  RuleSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Rule', RuleSchema);
};
