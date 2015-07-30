var React = require('react/addons');
var ControlGroup = require('CLIENT_PATH/components/form/ControlGroup.jsx');
var TextControl = require('CLIENT_PATH/components/form/TextControl.jsx');
var Button = require('CLIENT_PATH/components/form/Button.jsx');
var Spinner = require('CLIENT_PATH/components/form/Spinner.jsx');
var Actions = require('CLIENT_PATH/views/login/Actions.js');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;
var LinkedState = React.addons.LinkedStateMixin;

var Component = React.createClass({
  mixins: [LinkedState],
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

    var formElements;
    if (!this.state.success) {
      formElements =
        <fieldset>
          <TextControl
            name="username"
            label="Username or email"
            ref="username"
            hasError={this.state.hasError.username}
            //valueLink={this.linkState('username')}
            help={this.state.help.username}
            disabled={this.state.loading}
            />
          <TextControl
            name="password"
            label="Password"
            type="password"
            hasError={this.state.hasError.password}
            //valueLink={this.linkState('password')}
            help={this.state.help.password}
            disabled={this.state.loading}
            />
          <ControlGroup hideLabel={true} hideHelp={true}>
            <Button
              type="submit"
              inputClasses={{ 'btn-primary': true }}
              disabled={this.state.loading}>

              Login
              <Spinner space="left" show={this.state.loading} />
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