'use strict';

exports = module.exports = function(app, mongoose) {
  var settings = app.getSettings();
  var jwtSession = new mongoose.Schema({
    _id: {type: String},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    ip: {type: String},
    ua: {type: mongoose.Schema.Types.Mixed, default: ''},
    time: {type: Date, default: Date.now, expires: parseInt(settings.sessionExp)}
  });
  jwtSession.index({user: 1});
  app.db.model('JwtSession', jwtSession);
};