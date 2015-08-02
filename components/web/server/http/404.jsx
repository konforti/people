var React = require('react/addons');
var Layout = require('./../layouts/Default.jsx');

var Component = React.createClass({
    render: function () {
        var neck = <link rel='stylesheet' href="/pages/home.min.css"/>;

        return (
          <Layout
            title="Page Not Found"
            neck={neck}
            appName={this.props.appName}>

              <h1>Not found 404</h1>
              <p className="lead">
                  The resource you requested doesn't exist.
              </p>
          </Layout>
        );
    }
});

