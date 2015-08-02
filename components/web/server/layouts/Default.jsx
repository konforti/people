var React = require('react/addons');
var NavBar = require('./NavBar.jsx');


var Component = React.createClass({
    render: function () {

        return (
            <html>
                <head>
                    <title>{this.props.title}</title>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <link rel="stylesheet" href="/vendors/bootstrap.min.css" />
                    <link rel="stylesheet" href="/vendors/font-awesome.min.css" />
                    <link rel="stylesheet" href="/layouts/default.min.css" />
                    <link rel="shortcut icon" href="/media/favicon.ico" />
                    {this.props.neck}
                </head>
                <body>
                    <NavBar activeTab={this.props.activeTab} appName={this.props.activeTab}/>
                    <div className="page">
                        <div className="container">
                            {this.props.children}
                        </div>
                    </div>
                    <div className="footer">
                        <div className="container">
                            <span className="copyright pull-right">
                                &copy; {this.props.appName}
                            </span>
                            <ul className="links">
                                <li><a href="/">Home</a></li>
                                <li><a href="/contact">Contact</a></li>
                            </ul>
                            <div className="clearfix"></div>
                        </div>
                    </div>
                    <script src="/core.min.js"></script>
                    {this.props.feet}
                </body>
            </html>
        );
    }
});


module.exports = Component;
