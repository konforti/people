'use strict';

exports = module.exports = function(app, mongoose) {
  var RuleSchema = new mongoose.Schema({
    _id: { type: String },
    ON: { type: String, default: '' },
    OP: { type: String, default: '' },
    IF: { type: Array, default: [] },
    DO: { type: Array, default: [] }
  });

  RuleSchema.statics.getAll = function(done) {
    this.find({}, '_id').sort('name').exec(function (err, rules) {
      return done(err, rules);
    });
  };

  RuleSchema.plugin(require('./plugins/pagedFind'));
  RuleSchema.index({ ON: 1 });
  RuleSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Rule', RuleSchema);
};
