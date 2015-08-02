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
var clientPath = path.join(__dirname, '/components/web/client');

gulp.task('default', ['watch', 'build', 'nodemon']);

gulp.task('build', ['copy', 'less', 'webpack']);

gulp.task('watch', function () {
  global.isWatching = true;
  gulp.watch('./components/web/client/**/*.less', ['less']);
  gulp.watch('./components/remote/client/**/**/*.less', ['less']);
});

gulp.task('copy', function () {
  gulp.src([
    './node_modules/bootstrap/dist/css/bootstrap.min.css',
    './node_modules/font-awesome/css/font-awesome.min.css'
  ])
    .pipe(gulp.dest('./public/vendors'));

  gulp.src(['./node_modules/font-awesome/fonts/**'])
    .pipe(gulp.dest('./public/fonts'));

  gulp.src([clientPath + '/media/**/*'])
    .pipe(gulp.dest('./public/media'));
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
      clientPath + '/**/*',
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
    entries: clientPath + '/layouts/default.less',
    dest: './public/layouts',
    outputName: 'default.min.css'
  }, {
    entries: clientPath + '/pages/account/index.less',
    dest: './public/pages',
    outputName: 'account.min.css'
  }, {
    entries: clientPath + '/pages/admin/index.less',
    dest: './public/pages',
    outputName: 'admin.min.css'
  }, {
    entries: clientPath +'/pages/home/index.less',
    dest: './public/pages',
    outputName: 'home.min.css'
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
  var config = {
    watch: global.isWatching,
    entry: {
      account: clientPath + '/pages/account/index',
      admin: clientPath + '/pages/admin/index',
      contact: clientPath + '/pages/contact/index',
      login: clientPath + '/pages/login/index',
      signup: clientPath + '/pages/signup/index'
    },
    output: {
      path: './public/pages',
      filename: '[name].min.js',
      sourceMapFilename: '[name].map.js'
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    module: {
      loaders: [
        { test: /\.jsx$/, exclude: /node_modules/, loader: 'babel-loader' }
      ]
    },
    devtool: 'source-map',
    plugins: [
      new webpack.optimize.CommonsChunkPlugin('../core.min.js', undefined, 2),
      new UglifyJsPlugin({ compress: { warnings: false } })
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