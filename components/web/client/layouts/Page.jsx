var React = require('react/addons');
var NavBar = require('CLIENT_PATH/layouts/NavBar');
var Footer = require('CLIENT_PATH/layouts/Footer');

var Component = React.createClass({
  render: function () {
    return (
      <div>
        <NavBar activeTab={this.props.activeTab} appName="People"/>
        <div className="container">
          <h1 className="page-header">{this.props.title}</h1>
          {this.props.children}
        </div>
        <Footer appName="People"/>
      </div>
    );
  }
});

module.exports = Component;
