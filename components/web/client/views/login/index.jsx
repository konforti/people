var React = require('react/addons');
var ReactRouter = require('react-router');
var LoginForm = require('CLIENT_PATH/views/login/LoginForm.jsx');
var LoginStore = require('CLIENT_PATH/views/login/Store.js');
var Layout = require('CLIENT_PATH/layouts/Page.jsx');

var Component = React.createClass({
  getInitialState: function () {
    LoginStore.reset();
    return LoginStore.getState();
  },
  componentDidMount: function () {
    LoginStore.addChangeListener(this.onStoreChange);
    //this.refs.username.refs.inputField.getDOMNode().focus();
  },
  componentWillUnmount: function () {
    LoginStore.removeChangeListener(this.onStoreChange);
  },
  onStoreChange: function () {
    this.setState(LoginStore.getState());
  },
  render: function () {
    var alerts = [];
    if (this.state.success) {
      alerts.push(<div key="success" className="alert alert-success">
        Success. Redirecting...
      </div>);
    }
    else if (this.state.error) {
      alerts.push(<div key="danger" className="alert alert-danger">
        {this.state.error}
      </div>);
    }

    return (
      <Layout title="Login" activeTab="login">
        <section>
          <LoginForm data={this.state} />
        </section>
      </Layout>
    );
  }
});

module.exports = Component;
