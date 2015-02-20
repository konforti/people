'use strict';

var signature = require('cookie-signature');

exports.getUserBySid = function(req, res, next) {
  var collection = req.app.db.collection('sessions');
  //console.log(req.body);
  var sid = signature.unsign(req.body.sid, req.app.config.cryptoKey);

  collection.find({_id: sid}).toArray(function (err, record) {
    if (err) {
      return next(err, null);
    }

    if (!record || !record[0]) {
      return next('No Record', null);
    }
    var session = JSON.parse(record[0].session);
    req.app.db.models.User.findById(session.passport.user).populate('roles', 'name').exec(function (err, record) {
      if (err) {
        return next(err, null);
      }
      return next(null, record);
    });
  });
};