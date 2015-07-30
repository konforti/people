var React = require('react/addons');
var Layout = require('CLIENT_PATH/layouts/Page');

var Component = React.createClass({
    render: function () {

        return (
          <Layout title="About us" activeTab="about">
              <h1>About Us</h1>
              <p>People is a simple, easy to use, stand alone remote users management system.</p>
              <p>Yet, complete, powerful and secure following best practice and best security.</p>
          </Layout>
        );
    }
});


module.exports = Component;
