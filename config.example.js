'use strict';

exports.port = process.env.PORT || 3000;
exports.ip = process.env.IP || '127.0.0.1';
exports.mongodb = {
  uri: process.env.MONGODB_URL + 'people' || 'localhost/people'
};

// user 1 (master) ID.
// Can not be update or delete form the UI. Only straight form the DB.
exports.uid1 = '';
exports.cryptoKey = 'k3yb0ardc4t';
exports.public_key = 'pk_BDBFEA65CB85DC41FF9E928E7886C';
exports.secret_key = 'sk_A6D8FC87413B789E4E9E86FAC43A2';
