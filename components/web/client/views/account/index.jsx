var React = require('react/addons');
var ReactRouter = require('react-router');
var IdentityForm = require('CLIENT_PATH/views/account/IdentityForm.jsx');
var PasswordForm = require('CLIENT_PATH/views/account/PasswordForm.jsx');
var DeleteForm = require('CLIENT_PATH/views/account/DeleteForm.jsx');
var UserStore = require('CLIENT_PATH/views/account/Store.js');
var Actions = require('CLIENT_PATH/views/account/Actions.js');
var Layout = require('CLIENT_PATH/layouts/Page.jsx');

var LinkedState = React.addons.LinkedStateMixin;

var Component = React.createClass({
  mixins: [LinkedState],
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState: function () {
    UserStore.resetIdentity();
    UserStore.resetPassword();
    UserStore.resetDelete();

    Actions.getIdentity(this.context.router.getCurrentParams());

    return {
      identity: UserStore.getIdentity(),
      password: UserStore.getPassword(),
      delete: UserStore.getDelete()
    };
  },
  componentDidMount: function () {
    UserStore.addChangeListener(this.onStoreChange);
  },
  componentWillUnmount: function () {
    UserStore.removeChangeListener(this.onStoreChange);
  },
  onStoreChange: function () {
    this.setState({
      identity: UserStore.getIdentity(),
      password: UserStore.getPassword(),
      delete: UserStore.getDelete()
    });
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
      <Layout title="Account" activeTab="account">
        <section className="section-user-details container">
          <div className="row">
            <div className="col-sm-6">
              <IdentityForm data={this.state.identity} />
              <PasswordForm data={this.state.password} identity={this.state.identity} />
              <DeleteForm data={this.state.delete} details={this.state.identity} />
            </div>
          </div>
        </section>
      </Layout>
    );
  }
});

module.exports = Component;