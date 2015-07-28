'use strict';

var React = require('react/addons');
var NavBar = require('./NavBar');
var Footer = require('./Footer');

var Component = React.createClass({
  render: function () {
    return (
      <div>
        <NavBar activeTab={this.props.activeTab}/>
        <div className="container">
          {this.props.children}
        </div>
        <Footer/>
      </div>
    );
  }
});

module.exports = Component;
