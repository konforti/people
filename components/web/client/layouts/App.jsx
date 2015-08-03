var React = require('react/addons');
var ReactRouter = require('react-router');
var NavBar = require('./NavBar');
var Footer = require('./Footer');
var Cookie = require('cookie');
var $ = require('jquery');

$.ajaxSetup({
  beforeSend: function (xhr) {
    var cookie = Cookie.parse(document.cookie);
    if (cookie['people.token']) {
      xhr.setRequestHeader('Authorization','Bearer ' + cookie['people.token']);
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
