'use strict';

exports = module.exports = function(app, mongoose) {
  //embeddable docs first
  require('./Note')(app, mongoose);
  require('./Status')(app, mongoose);
  require('./StatusLog')(app, mongoose);
  require('./Settings')(app, mongoose);

  //then regular docs
  require('./User')(app, mongoose);
  require('./UserMeta')(app, mongoose);
  require('./Role')(app, mongoose);
  require('./LoginAttempt')(app, mongoose);
};
