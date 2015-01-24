'use strict';

exports = module.exports = function(app, mongoose) {
  //embeddable docs first
  require('./schema/Note')(app, mongoose);
  require('./schema/Status')(app, mongoose);
  require('./schema/StatusLog')(app, mongoose);

  //then regular docs
  require('./schema/User')(app, mongoose);
  require('./schema/Role')(app, mongoose);
  require('./schema/LoginAttempt')(app, mongoose);
};
