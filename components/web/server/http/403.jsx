var React = require('react/addons');
var Layout = require('./../layouts/Default.jsx');

var Component = React.createClass({
    render: function () {
        var neck = <link rel='stylesheet' href="/pages/home.min.css"/>;

        return (
          <Layout
            title="Access Denied"
            neck={neck}
            appName={this.props.appName}>
              <h1>Forbidden 403</h1>
              <p className="lead">
                  The resource you requested is forbidden.
              </p>
          </Layout>
        );
    }
});

