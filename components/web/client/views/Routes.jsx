var React = require('react/addons');
var Home = require('CLIENT_PATH/views/home');
var About = require('CLIENT_PATH/views/about');
var Account = require('CLIENT_PATH/views/account');
var App = require('CLIENT_PATH/layouts/App');
var NotFound = require('CLIENT_PATH/views/notFound');
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;


var routes = (
    <Route path="/" name="app" handler={App}>
        <DefaultRoute name="home" handler={Home} />

        <Route path="about" name="about" handler={About} />
        <Route path="account" name="account" handler={Account} />

        <NotFoundRoute name="notFound" handler={NotFound} />
    </Route>
);

Router.run(routes, Router.HistoryLocation, function(Handler) {
   React.render(
    <Handler />,
    document.getElementById('page')
  );
});

module.exports = routes;
