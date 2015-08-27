var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      vendor: {
        files: [
          {
            expand: true, cwd: 'node_modules/codemirror/',
            src: ['addon/**', 'lib/**', 'mode/**'], dest: 'public/vendor/codemirror/'
          },
          {
            expand: true, cwd: 'node_modules/font-awesome/',
            src: ['fonts/**', 'css/font-awesome.min.css'], dest: 'public/vendor/font-awesome/'
          }
        ]
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          ignore: [
            'node_modules/**',
            'public/**'
          ],
          ext: 'js'
        }
      }
    },
    watch: {
      clientJS: {
         files: [
          'components/web/client/layouts/**/*.js',
          'components/web/client/views/**/*.js',
          'components/remote/client/cdn/**/*.js'
         ],
         tasks: ['newer:uglify', 'newer:jshint:client']
      },
      serverJS: {
         files: ['components/**/*.js'],
         tasks: ['newer:jshint:server']
      },
      clientLess: {
         files: [
          'components/web/client/views/**/*.less',
          'components/web/client/less/**/*.less'
         ],
         tasks: ['newer:less']
      },
      layoutLess: {
        files: [
          'components/web/client/layouts/**/*.less',
          'components/web/client/less/**/*.less',
          'components/remote/client/cdn/**/**/*.less'
        ],
        tasks: ['less:layouts']
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: function(filePath) {
          return filePath + '.map';
        }
      },
      layouts: {
        files: {
          'public/layouts/core.min.js': [
            'node_modules/jquery/dist/jquery.js',
            'node_modules/jquery.cookie/jquery.cookie.js',
            'node_modules/underscore/underscore.js',
            'node_modules/backbone/backbone.js',
            'node_modules/bootstrap/js/bootstrap.js',
            'node_modules/momentjs/moment.js',
            'components/web/client/layouts/core.js'
          ],
          'public/layouts/ie-sucks.min.js': [
            'node_modules/html5shiv/dist/html5shiv.js',
            'node_modules/respond.js/dest/respond.js'
          ],
          'public/layouts/admin.min.js': ['components/web/client/layouts/admin.js']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'components/web/client/views/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'public/views/',
          ext: '.min.js'
        }]
      },
      cdn: {
        files: [{
          expand: true,
          cwd: 'components/remote/client/cdn/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'public/cdn/',
          ext: '.min.js'
        }]
      }
    },
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
            'public/layouts/**/*.min.js',
            'public/views/**/*.min.js',
            'public/cdn/**/*.min.js'
          ]
        },
        src: [
          'components/web/client/layouts/**/*.js',
          'components/web/client/views/**/*.js',
          'components/remote/client/cdn/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'schema/**/*.js',
          'components/**/*.js'
        ]
      }
    },
    less: {
      options: {
        compress: true
      },
      layouts: {
        files: {
          'public/layouts/core.min.css': [
            'node_modules/bootstrap/dist/css/bootstrap.css',
            'components/web/client/layouts/core.less'
          ],
          'public/layouts/admin.min.css': ['components/web/client/layouts/admin.less'],
          'public/cdn/themes/people-basic.min.css': ['components/remote/client/cdn/themes/less/people-basic.less'],
          'public/cdn/themes/people-blue.min.css': ['components/remote/client/cdn/themes/less/people-blue.less'],
          'public/cdn/themes/people-cards.min.css': ['components/remote/client/cdn/themes/less/people-cards.less']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'components/web/client/views/',
          src: ['**/*.less'],
          dest: 'public/views/',
          ext: '.min.css'
        }]
      },
      cdn: {
        files: [{
          expand: true,
          cwd: 'components/remote/client/cdn/themes/less/',
          src: ['**/*.less', '!**/shared.less'],
          dest: 'public/cdn/themes/',
          ext: '.min.css'
        }]
      }
    },
    clean: {
      js: {
        src: [
          'public/layouts/**/*.min.js',
          'public/layouts/**/*.min.js.map',
          'public/views/**/*.min.js',
          'public/views/**/*.min.js.map',
          'public/cdn/**/*.min.js',
          'public/cdn/**/*.min.js.map'
        ]
      },
      css: {
        src: [
          'public/layouts/**/*.min.css',
          'public/views/**/*.min.css',
          'public/cdn/**/*.min.css'
        ]
      },
      vendor: {
        src: ['public/vendor/**']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');

  grunt.registerTask('default', ['copy:vendor', 'newer:uglify', 'newer:less', 'concurrent']);
  grunt.registerTask('build', ['copy:vendor', 'uglify', 'less']);
  grunt.registerTask('lint', ['jshint']);
};
