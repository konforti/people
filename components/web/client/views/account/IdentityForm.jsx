var React = require('react/addons');
var ControlGroup = require('CLIENT_PATH/components/form/ControlGroup.jsx');
var TextControl = require('CLIENT_PATH/components/form/TextControl.jsx');
var SelectControl = require('CLIENT_PATH/components/form/SelectControl.jsx');
var Button = require('CLIENT_PATH/components/form/Button.jsx');
var Spinner = require('CLIENT_PATH/components/form/Spinner.jsx');
var Actions = require('CLIENT_PATH/views/account/Actions.js');

var Component = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState: function () {
    return {};
  },
  componentWillReceiveProps: function (nextProps) {

    if (!this.state.hydrated) {
      this.setState({
        username: nextProps.data.username,
        email: nextProps.data.email
      });
    }
  },
  handleSubmit: function (event) {

    event.preventDefault();
    event.stopPropagation();

    Actions.saveIdentity({
      id: this.props.data._id,
      username: this.state.username,
      email: this.state.email
    });
  },
  render: function () {
    var alerts = [];
    if (this.props.data.success) {
      alerts.push(<div key="success" className="alert alert-success">
        Success. Changes have been saved.
      </div>);
    }
    else if (this.props.data.error) {
      alerts.push(<div key="danger" className="alert alert-danger">
        {this.props.data.error}
      </div>);
    }

    var notice;
    if (!this.props.data.hydrated) {
      notice = <div className="alert alert-info">
        Loading data...
      </div>;
    }


    var identity =
      <div id="identity">
        <legend>Identity</legend>
        {alerts}
        <TextControl
          name="username"
          label="Username"
          hasError={this.props.data.hasError.username}
          valueLink={this.linkState('username')}
          help={this.props.data.help.username}
          disabled={this.props.data.loading}
          />
        <TextControl
          name="email"
          label="Email"
          hasError={this.props.data.hasError.email}
          valueLink={this.linkState('email')}
          help={this.props.data.help.email}
          disabled={this.props.data.loading}
          />
      </div>;

    var fields =
      this.props.data.fields.forEach(function(field, idx, arr) {
        return <TextControl
          name={field.id}
          label={field.name}
          hasError={field.props.data.hasError.field.id}
          valueLink={field.linkState(field.id)}
          help={field.props.data.help.field.id}
          disabled={field.props.data.loading}
          />
      });

    var submit =
      <ControlGroup hideLabel={true} hideHelp={true}>
        <Button
          type="submit"
          inputClasses={{ 'btn-primary': true }}
          disabled={this.props.data.loading}>

          Save changes
          <Spinner space="left" show={this.props.data.loading} />
        </Button>
      </ControlGroup>;


    var formElements;
    if (this.props.data.hydrated) {

      formElements =
        <div>
          {alerts}
          {identity}
          {fields}
          {submit}
        </div>;
    }

    return (
      <form onSubmit={this.handleSubmit}>
        {notice}
        {formElements}
      </form>
    );
  }
});

module.exports = Component;
