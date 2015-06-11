'use strict';

exports.port = process.env.PORT || 3000;
exports.ip = process.env.IP || '127.0.0.1';
exports.mongodb = {
  uri: process.env.MONGODB_URL + 'people' || 'localhost/people'
};

// user 1 (master) ID.
// Can not be update or delete form the UI. Only straight form the DB.
exports.uid1 = '';
