/* global window */
var Dispatcher = require('flux-dispatcher');
var Cookie = require('cookie');
var Constants = require('./Constants');
var Fetch = require('../../helpers/jsonFetch');
var RedirectActions = require('../../actions/Redirect');


var VIEW_ACTION = Constants.PayloadSources.VIEW_ACTION;
var SERVER_ACTION = Constants.PayloadSources.SERVER_ACTION;
var Types = Constants.ActionTypes;
var dispatch = Dispatcher.handleAction;


var urlBase64Decode = function(str) {
  var output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: {break;}
    case 2: {output += '=='; break;}
    case 3: {output += '=';  break;}
    default: {throw 'Illegal base64url string!';}
  }
  return decodeURIComponent(escape(window.atob(output)));
};

var Actions = {

    forgot: function (data) {

        dispatch(VIEW_ACTION, Types.FORGOT, data);

        var request = {
            method: 'POST',
            url: '/forgot',
            data: data
        };

        Fetch(request, function (err, response) {

            if (!err) {
                response.success = true;
            }

            dispatch(SERVER_ACTION, Types.FORGOT_RESPONSE, response);
        });
    },
    login: function (data) {

        dispatch(VIEW_ACTION, Types.LOGIN, data);

        var request = {
            method: 'POST',
            url: '/login',
            data: data
        };

        Fetch(request, function (err, response) {


            if (!err) {
                var cookie = Cookie.parse(document.cookie);

                var payload = cookie['people.token'].split('.')[1];
                payload = urlBase64Decode(payload);
                sessionStorage.setItem('people.user', payload);
                window.location.href = '/account';
                response.success = true;
            }

            dispatch(SERVER_ACTION, Types.LOGIN_RESPONSE, response);
        });
    },
    logout: function (data) {

        dispatch(VIEW_ACTION, Types.LOGOUT, data);

        var request = {
            method: 'DELETE',
            url: '/logout',
            data: data,
            useAuth: true
        };

        Fetch(request, function (err, response) {

            if (!err) {
                response.success = true;
            }
            else {
                response.error = err.message;
            }

            dispatch(SERVER_ACTION, Types.LOGOUT_RESPONSE, response);
        });
    },
    reset: function (data) {

        dispatch(VIEW_ACTION, Types.RESET, data);

        var request = {
            method: 'POST',
            url: '/reset',
            data: data
        };

        Fetch(request, function (err, response) {

            if (!err) {
                response.success = true;
            }

            dispatch(SERVER_ACTION, Types.RESET_RESPONSE, response);
        });
    }
};


module.exports = Actions;
