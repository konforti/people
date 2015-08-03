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
      data: data,
      error: function (err) {
      },
      success: function (res) {
        dispatch(SERVER_ACTION, Types.GET_IDENTITY_RESPONSE, res);
      }
    });
  },
  saveIdentity: function (data) {
    dispatch(VIEW_ACTION, Types.SAVE_IDENTITY, data);
    $.ajax({
      method: 'PUT',
      url: '/account',
      data: data,
      error: function (err) {},
      success: function (res) {
        if (res.success) {
          res.success = true;
        }
        dispatch(SERVER_ACTION, Types.SAVE_IDENTITY_RESPONSE, res);
      }
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
      data: data,
    }, function (err, response) {
      if (!err) {
        response.success = true;
      }
      dispatch(SERVER_ACTION, Types.SAVE_PASSWORD_RESPONSE, response);
    });
  }
};

module.exports = Actions;
