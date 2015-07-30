var Dispatcher = require('flux-dispatcher');
var FluxStore = require('flux-store');
var CloneDeep = require('lodash/lang/cloneDeep');
var Moment = require('moment');
var Constants = require('CLIENT_PATH/views/account/Constants.js');

var ActionTypes = Constants.ActionTypes;

var Store = FluxStore.extend({
  dispatcher: Dispatcher,
  state: {},
  defaultState: {
    identity: {
      hydrated: false,
      fetchFailure: false,
      loading: false,
      success: false,
      error: undefined,
      hasError: {},
      help: {},
      _id: undefined,
      name: {},
      user: {},
      email: {},
      fields: []
    },
    delete: {
      loading: false,
      error: undefined
    }
  },
  getState: function () {
    return this.state;
  },
  getIdentity: function () {
    return this.state.identity;
  },
  getPassword: function () {
    return this.state.password;
  },
  getDelete: function () {
    return this.state.delete;
  },
  reset: function () {
    this.state = {
      identity: CloneDeep(this.defaultState.identity),
      password: CloneDeep(this.defaultState.password),
      delete: CloneDeep(this.defaultState.delete)
    };
  },
  resetIdentity: function () {
    this.state.identity = CloneDeep(this.defaultState.identity);
  },
  resetPassword: function () {
    this.state.password = CloneDeep(this.defaultState.password);
  },
  resetDelete: function () {
    this.state.delete = CloneDeep(this.defaultState.delete);
  },
  onDispatcherAction: function (payload) {
    var action = payload.action;

    switch (action.type) {

      case ActionTypes.GET_IDENTITY:
        this.state.identity.loading = true;
        this.state.identity.hydrated = false;
        this.state.identity.success = false;
        this.emitChange();
        break;

      case ActionTypes.GET_IDENTITY_RESPONSE:
        this.state.identity.loading = false;
        this.state.identity.hydrated = true;
        this.state.identity.fetchFailure = action.data.fetchFailure;
        this.state.identity.success = action.data.success;
        this.state.identity._id = action.data._id;
        this.state.identity.name = action.data.name;
        this.state.identity.user = action.data.user;
        this.emitChange();
        break;

      case ActionTypes.SAVE_IDENTITY:
        this.state.identity.loading = true;
        this.emitChange();

      case ActionTypes.SAVE_IDENTITY_RESPONSE:
        this.state.identity.loading = false;
        this.state.identity.success = action.data.success;

        if (action.data.success) {
          setTimeout(function () {

            this.state.identity.success = undefined;
            this.emitChange();
          }.bind(this), 2500);

          this.state.identity.name = action.data.name;
        }

        this.emitChange();
        break;

      case ActionTypes.DELETE:
        this.state.delete.loading = true;
        this.emitChange();
        break;

      case ActionTypes.DELETE_RESPONSE:
        this.state.delete.loading = false;

        if (action.data.success) {
        }
        else {
          setTimeout(function () {

            this.state.delete.error = undefined;
            this.emitChange();
          }.bind(this), 2500);
        }

        this.emitChange();
        break;
    }
  }
});


module.exports = Store;
