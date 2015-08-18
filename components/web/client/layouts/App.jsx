var React = require('react/addons');
var ReactRouter = require('react-router');
var NavBar = require('./NavBar');
var Footer = require('./Footer');
var Cookies = require('js-cookie');
var $ = require('jquery');

$.ajaxSetup({
  beforeSend: function (xhr) {
    var cookie = Cookies.get('people.token');
    if (cookie) {
      xhr.setRequestHeader('Authorization','Bearer ' + cookie);
    }
  },
  statusCode: {
    403: function() {
      location.href = '/login';
    }
  }
});

var Component = React.createClass({
    render: function () {
        return (
          <ReactRouter.RouteHandler />
        );
    }
});


module.exports = Component;
