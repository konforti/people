var Dispatcher = require('flux-dispatcher');
var FluxStore = require('flux-store');
var CloneDeep = require('lodash/lang/cloneDeep');
var Constants = require('CLIENT_PATH/views/login/Constants');

var ActionTypes = Constants.ActionTypes;

var Store = FluxStore.extend({
    dispatcher: Dispatcher,
    state: {},
    defaultState: {
        loading: false,
        success: false,
        errors: [],
        hasError: {},
    },
    getState: function () {
        return this.state;
    },
    reset: function () {
        this.state = CloneDeep(this.defaultState);
    },
    onDispatcherAction: function (payload) {
        var action = payload.action;

        if (ActionTypes.LOGIN === action.type) {
            this.state.loading = true;
            this.state.success = false;
            this.state.errors = [];
            this.state.hasError = {};
            this.emitChange();
        }

        if (ActionTypes.LOGIN_RESPONSE === action.type) {
            this.state.loading = false;
            this.state.success = action.data.success;
            this.state.hasError = action.data.errfor;
            this.state.errors = action.data.errors;

            this.emitChange();
        }
    }
});


module.exports = Store;
