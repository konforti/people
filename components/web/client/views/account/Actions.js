var Dispatcher = require('flux-dispatcher');
var Constants = require('CLIENT_PATH/views/account/Constants.js');
var $ = require('jquery');

var VIEW_ACTION = Constants.PayloadSources.VIEW_ACTION;
var SERVER_ACTION = Constants.PayloadSources.SERVER_ACTION;
var Types = Constants.ActionTypes;
var dispatch = Dispatcher.handleAction;

var Actions = {
  getIdentity: function (data) {
    dispatch(VIEW_ACTION, Types.GET_IDENTITY, data);
    $.ajax({
      method: 'GET',
      url: '/account',
      data: data
    })
      .done(function(res) {
        dispatch(SERVER_ACTION, Types.GET_IDENTITY_RESPONSE, res);
      })
      .fail(function(err) {
      });
  },
  saveIdentity: function (data) {
    dispatch(VIEW_ACTION, Types.SAVE_IDENTITY, data);
    $.ajax({
      method: 'PUT',
      url: '/account',
      data: data
    })
      .done(function(res) {
        if (res.success) {
          res.success = true;
        }
        dispatch(SERVER_ACTION, Types.SAVE_IDENTITY_RESPONSE, res);
    })
      .fail(function(err) {
      });
  },
  savePassword: function (data) {
    dispatch(VIEW_ACTION, Types.SAVE_PASSWORD, data);
    if (data.password !== data.passwordConfirm) {
      dispatch(VIEW_ACTION, Types.SAVE_PASSWORD_RESPONSE, {
        message: 'Passwords do not match.'
      });
      return;
    }

    delete data.passwordConfirm;
    $.ajax({
      method: 'PUT',
      url: '/account/password',
      data: data
    })
      .done(function(res) {
        if (!err) {
          response.success = true;
        }
        dispatch(SERVER_ACTION, Types.SAVE_PASSWORD_RESPONSE, res);
      });
  }
};

module.exports = Actions;
