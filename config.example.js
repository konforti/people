'use strict';

exports.port = process.env.PORT || 3000;
exports.ip = process.env.IP || '127.0.0.1';
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost/people'
};

exports.cryptoKey = 'k3yb0ardc4t';// Changes this.
exports.public_key = 'pk_BDBFEA65CB85DC41FF9E928E7886C';// Changes this.
exports.secret_key = 'sk_A6D8FC87413B789E4E9E86FAC43A2';// Changes this.

exports.csrfExclusion = ['/remote/','/api/'];
exports.requireAccountVerification = false;

// user 1 (master) ID.
// Can not be update or delete form the UI. Only straight form the DB.
exports.uid1 = '';