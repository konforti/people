'use strict';

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var path = require('path');
var less = require('gulp-less');
var gutil = require('gulp-util');
var webpack = require('webpack');
var newer = require('gulp-newer');
var concat = require('gulp-concat');
var glob = require('glob');

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var executionCount = 0;

gulp.task('default', ['watch', 'build', 'nodemon']);

gulp.task('build', ['copy', 'less', 'webpack']);

gulp.task('watch', function () {
  global.isWatching = true;
  gulp.watch('./components/web/client/views/**/*.less', ['less']);
  gulp.watch('./components/web/client/layouts/**/*.less', ['less']);
  gulp.watch('./components/remote/client/cdn/**/**/*.less', ['less']);
});

gulp.task('copy', function () {
  gulp.src([
    './node_modules/bootstrap/dist/css/bootstrap.min.css',
    './node_modules/font-awesome/css/font-awesome.min.css'
  ])
    .pipe(gulp.dest('./public/vendors'));

  gulp.src([
    './node_modules/font-awesome/fonts/*'
  ])
    .pipe(gulp.dest('./public/fonts'));
});

gulp.task('nodemon', function () {
  var nodeArgs = [];
  if (process.env.DEBUGGER) {
    nodeArgs.push('--debug');
  }

  nodemon({
    script: 'server.js',
    ext: 'js jsx',
    ignore: [
      'public/**/*',
      'node_modules/**/*'
    ],
    nodeArgs: nodeArgs
  })
    .on('restart', function (files) {
      console.log('change detected:', files);
    });
});

gulp.task('less', function () {
  var bundleConfigs = [{
    entries: './components/web/client/views/**/*.less',
    dest: './public/views',
    outputName: 'views.min.css'
  },{
    entries: './components/web/client/layouts/**/*.less',
    dest: './public/views',
    outputName: 'layouts.min.css'
  },{
    entries: './components/web/client/admin/**/*.less',
    dest: './public/views',
    outputName: 'admin.min.css'
  },{
    entries: './components/remote/client/cdn/themes/less/people-basic.less',
    dest: './public/cdn/themes',
    outputName: 'people-basic.min.css'
  }];

  return bundleConfigs.map(function (bundleConfig) {
    return gulp.src(bundleConfig.entries)
      .pipe(newer(path.join(bundleConfig.dest, bundleConfig.outputName)))
      .pipe(concat(bundleConfig.outputName))
      .pipe(less({ compress: true }))
      .pipe(gulp.dest(bundleConfig.dest));
  });
});

gulp.task('webpack', function (callback) {
  var clientPath = path.join(__dirname, '/components/web/client');
  var config = {
    watch: global.isWatching,
    entry: {
      routs: clientPath + '/views/Routes.jsx'
    },
    output: {
      path: './public/views',
      filename: '[name].min.js',
      sourceMapFilename: '[name].map.js'
    },
    resolve: {
      alias: {CLIENT_PATH: clientPath},
      extensions: ['', '.js', '.jsx']
    },
    module: {
      loaders: [
        {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
        {test: /\.jsx$/, exclude: /node_modules/, loader: 'babel-loader'}
      ]
    },
    devtool: 'source-map',
    plugins: [
      //new webpack.optimize.CommonsChunkPlugin('./views.min.js', undefined, 2),
      new UglifyJsPlugin({compress: {warnings: false}})
    ]
  };
  webpack(config, function (err, stats) {
      if (err) {
        throw new gutil.PluginError('webpack', err);
      }

      gutil.log('[webpack]', stats.toString({
        colors: true,
        chunkModules: false
      }));

      if (executionCount === 0) {
        callback();
      }
      executionCount += 1;
    });
});