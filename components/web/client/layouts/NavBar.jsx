var React = require('react/addons');
var Router = require('react-router');
var Link = Router.Link;
var ClassNames = require('classnames');


var Component = React.createClass({
    tabClass: function (tab) {
        return ClassNames({
            active: this.props.activeTab === tab
        });
    },
    render: function () {
        return (
            <div className="navbar navbar-default navbar-fixed-top">
                <div className="container">
                    <div className="navbar-header">
                        <Link to="/" className="navbar-brand">
                            <img
                                className="navbar-logo"
                                src="/media/logo-symbol-32x32.png"
                            />
                            <span className="navbar-brand-label">{this.props.appName}</span>
                        </Link>
                    </div>
                    <div>
                        <ul className="nav navbar-nav">
                            <li className={this.tabClass('home')}>
                                <Link to="/">Home</Link>
                            </li>
                            <li className={this.tabClass('about')}>
                                <Link to="/about">About</Link>
                            </li>
                        </ul>
                        <ul className="nav navbar-nav navbar-right">
                            <li className={this.tabClass('login')}>
                                <Link to="/login">
                                    <i className="fa fa-user">Login</i>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
});


module.exports = Component;
