var React = require('react/addons');

var Component = React.createClass({
    render: function () {
      var message = '';
      if (this.props.message) {
        message =
          <div key={this.props.message.type} className={"alert" + this.props.message.type}>
              {this.props.message}
          </div>;
      }

      return (
        <div>
          {message}
        </div>
      );
    }
});


module.exports = Component;
