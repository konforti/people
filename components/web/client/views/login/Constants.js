import FluxConstant from 'flux-constant';

module.exports = {
    PayloadSources: FluxConstant.set([
        'SERVER_ACTION',
        'VIEW_ACTION'
    ]),
    ActionTypes: FluxConstant.set([
        'LOGIN',
        'LOGIN_RESPONSE'
    ])
};
