var React = require('react/addons');
var ControlGroup = require('CLIENT_PATH/components/form/ControlGroup.jsx');
var TextControl = require('CLIENT_PATH/components/form/TextControl.jsx');
var Button = require('CLIENT_PATH/components/form/Button.jsx');
var Spinner = require('CLIENT_PATH/components/form/Spinner.jsx');
var Actions = require('CLIENT_PATH/views/login/Actions.js');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;

var Component = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState: function () {
    return {};
  },
  componentWillReceiveProps: function (nextProps) {
    if (!this.state.hydrated) {
      this.setState(nextProps.data);
    }
  },
  handleSubmit: function (event) {
    event.preventDefault();
    event.stopPropagation();

    Actions.login({
      username: this.state.username,
      password: this.state.password
    });
  },
  render: function () {
    var alerts = [];
    if (this.props.data.success) {
      alerts.push(<div key="success" className="alert alert-success">
        Success. Redirecting...
      </div>);
    }
    else if (this.props.data.error) {
      alerts.push(<div key="danger" className="alert alert-danger">
        {this.props.data.error}
      </div>);
    }

    var formElements;
    if (!this.props.data.success) {
      formElements =
        <fieldset>
          <TextControl
            name="username"
            label="Username or email"
            ref="username"
            hasError={this.props.data.hasError.username}
            valueLink={this.linkState('username')}
            disabled={this.props.data.loading}
            />
          <TextControl
            name="password"
            label="Password"
            type="password"
            hasError={this.props.data.hasError.password}
            valueLink={this.linkState('password')}
            disabled={this.props.data.loading}
            />
          <ControlGroup hideLabel={true} hideHelp={true}>
            <Button
              type="submit"
              inputClasses={{ 'btn-primary': true }}
              disabled={this.props.data.loading}>

              Login
              <Spinner space="left" show={this.props.data.loading} />
            </Button>
          </ControlGroup>
        </fieldset>;
    }

    return (
      <form onSubmit={this.handleSubmit}>
        {alerts}
        {formElements}
      </form>
    );
  }
});

module.exports = Component;