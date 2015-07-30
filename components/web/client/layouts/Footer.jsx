var React = require('react/addons');

var Component = React.createClass({
    render: function () {
        return (
            <div className="footer">
                <div className="container">
                    <span className="copyright pull-right">
                        &#169; {this.props.appName}
                    </span>
                    <ul className="links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/admin">Admin</a></li>
                        <li><a href="/logout">Sign out</a></li>
                    </ul>
                </div>
            </div>
        );
    }
});


module.exports = Component;
