var React = require('react/addons');
var Layout = require('../../layouts/Page');

var Component = React.createClass({
    render: function () {
        return (
            <Layout title={this.props.appName} activeTab="home">
                <div className="jumbotron">
                    <h1>{this.props.appName}</h1>
                    <p className="lead">
                        Full Identity System
                    </p>
                </div>
            </Layout>
        );
    }
});


module.exports = Component;
