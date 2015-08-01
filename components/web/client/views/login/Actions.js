var Dispatcher = require('flux-dispatcher');
var Constants = require('CLIENT_PATH/views/login/Constants.js');
var Cookie = require('cookie');
var Ajax = require('reqwest');

var VIEW_ACTION = Constants.PayloadSources.VIEW_ACTION;
var SERVER_ACTION = Constants.PayloadSources.SERVER_ACTION;
var Types = Constants.ActionTypes;
var dispatch = Dispatcher.handleAction;

var Actions = {
  login: function (data) {

    dispatch(VIEW_ACTION, Types.LOGIN, data);

    Ajax({
      method: 'POST',
      url: '/login',
      data: data,
      error: function (err) {
      },
      success: function (res) {
        console.log(res);
        if (res.success) {
          var cookies = Cookie.parse(document.cookie);
          if (cookies['people.token']) {
            var payload = data.jwt.split('.')[1];
            payload = urlBase64Decode(payload);
            sessionStorage.setItem('people.user', payload);

            window.location.href = '/account';
            res.success = true;
          }
        }
        dispatch(SERVER_ACTION, Types.LOGIN_RESPONSE, res);
      }
    });
  }
};

module.exports = Actions;
