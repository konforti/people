var React = require('react/addons');
var NavBar = require('CLIENT_PATH/layouts/NavBar');
var Footer = require('CLIENT_PATH/layouts/Footer');

var Component = React.createClass({
  render: function () {
    return (
      <div>
        <NavBar activeTab={this.props.activeTab} appName="People"/>
        <div className="container">
          {this.props.children}
        </div>
        <Footer appName="People"/>
      </div>
    );
  }
});

module.exports = Component;
