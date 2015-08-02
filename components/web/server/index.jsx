var React = require('react/addons');
var Layout = require('./layouts/Default.jsx');

var Component = React.createClass({
  render: function () {

    var neck = <link rel="stylesheet" href="/pages/home.min.css"/>;

    return (
  <Layout
        title={this.props.appName}
        neck={neck}
        activeTab="home"
        appName={this.props.appName}>

        <div className="jumbotron">
          <h1>People</h1>

          <p className="lead">
            Full Featured Identity System
          </p>
        </div>
      </Layout>
        );
  }
});

module.exports = Component;
