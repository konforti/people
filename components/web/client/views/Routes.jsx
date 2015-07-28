'use strict';

var React = require('react/addons');
var Home = require('./home');
var About = require('./about');
var App = require('../layouts/App');
var NotFound = require('./notFound');

var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;


var routes = (
    <Route path="/" name="app" handler={App}>
        <DefaultRoute name="home" handler={Home} />

        <Route path="about" name="about" handler={About} />

        <NotFoundRoute name="notFound" handler={NotFound} />
    </Route>
);

Router.run(routes, Router.HistoryLocation, (Handler) => {
   React.render(
    <Handler />,
    document.getElementById('page')
  );
});

module.exports = routes;
