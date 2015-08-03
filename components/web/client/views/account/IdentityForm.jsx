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
      var rows = {};
      nextProps.data.fieldsData.forEach(function(fd) {
        for(var key in fd) {
          if (fd.hasOwnProperty(key)) {
            rows[key] = fd[key];
          }
        }
      });

      rows.username = nextProps.data.username;
      rows.email = nextProps.data.email;

      this.setState(rows);
    }
  },
  handleSubmit: function (event) {
    event.preventDefault();
    event.stopPropagation();

    var _self = this;
    var save = {fields: []};
    this.props.data.fields.forEach(function(field) {
      var row = {};
      row[field._id] = _self.state[field._id] || '';
      save.fields.push(row);
    });

    save.id = this.props.data._id;
    save.username = this.state.username;
    save.email = this.state.email;

    Actions.saveIdentity(save);
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
          disabled={this.props.data.loading}
          />
        <TextControl
          name="email"
          label="Email"
          hasError={this.props.data.hasError.email}
          valueLink={this.linkState('email')}
          disabled={this.props.data.loading}
          />
      </div>;

    var _self = this;
    var fields = [];
    this.props.data.fields.forEach(function(field) {
      fields.push(<TextControl
        key={field._id}
        name={field._id}
        label={field.name}
        hasError={_self.props.data.hasError[field.id]}
        valueLink={_self.linkState(field._id)}
        disabled={_self.props.data.loading}
        />)
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
