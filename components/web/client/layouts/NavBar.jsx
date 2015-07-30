var React = require('react/addons');
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
                        <a className="navbar-brand" href="/">
                            <img
                                className="navbar-logo"
                                src="/media/logo-symbol-32x32.png"
                            />
                            <span className="navbar-brand-label">{this.props.appName}</span>
                        </a>
                    </div>
                    <div>
                        <ul className="nav navbar-nav">
                            <li className={this.tabClass('home')}>
                                <a href="/">Home</a>
                            </li>
                            <li className={this.tabClass('about')}>
                                <a href="/about">About</a>
                            </li>
                        </ul>
                        <ul className="nav navbar-nav navbar-right">
                            <li className={this.tabClass('login')}>
                                <a href="/login">
                                    <i className="fa fa-user">Login</i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
});


module.exports = Component;
