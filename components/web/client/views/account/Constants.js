var FluxConstant = require('flux-constant');

module.exports = {
  PayloadSources: FluxConstant.set([
    'SERVER_ACTION',
    'VIEW_ACTION'
  ]),
  ActionTypes: FluxConstant.set([
    'GET_IDENTITY',
    'GET_IDENTITY_RESPONSE',
    'SAVE_IDENTITY',
    'SAVE_IDENTITY_RESPONSE',
    'SAVE_PASSWORD',
    'SAVE_PASSWORD_RESPONSE'
  ])
};
