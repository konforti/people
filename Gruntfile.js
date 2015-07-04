var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      vendor: {
        files: [
          {
            expand: true, cwd: 'bower_components/bootstrap/',
            src: ['js/**', 'less/**'], dest: 'components/web/public/vendor/bootstrap/'
          },
          {
            expand: true, cwd: 'bower_components/backbone/',
            src: ['backbone.js'], dest: 'components/web/public/vendor/backbone/'
          },
          {
            expand: true, cwd: 'bower_components/codemirror/',
            src: ['addon/**', 'lib/**', 'mode/**'], dest: 'components/web/public/vendor/codemirror/'
          },
          {
            expand: true, cwd: 'bower_components/font-awesome/',
            src: ['fonts/**', 'less/**'], dest: 'components/web/public/vendor/font-awesome/'
          },
          {
            expand: true, cwd: 'bower_components/html5shiv/dist/',
            src: ['html5shiv.js'], dest: 'components/web/public/vendor/html5shiv/'
          },
          {
            expand: true, cwd: 'bower_components/jquery/dist/',
            src: ['jquery.js'], dest: 'components/web/public/vendor/jquery/'
          },
          {
            expand: true, cwd: 'bower_components/jquery.cookie/',
            src: ['jquery.cookie.js'], dest: 'components/web/public/vendor/jquery.cookie/'
          },
          {
            expand: true, cwd: 'bower_components/momentjs/',
            src: ['moment.js'], dest: 'components/web/public/vendor/momentjs/'
          },
          {
            expand: true, cwd: 'bower_components/respond/src/',
            src: ['respond.js'], dest: 'components/web/public/vendor/respond/'
          },
          {
            expand: true, cwd: 'bower_components/underscore/',
            src: ['underscore.js'], dest: 'components/web/public/vendor/underscore/'
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
            'components/web/public/**'
          ],
          ext: 'js'
        }
      }
    },
    watch: {
      clientJS: {
         files: [
          'components/web/public/layouts/**/*.js', '!components/web/public/layouts/**/*.min.js',
          'components/web/public/views/**/*.js', '!components/web/public/views/**/*.min.js',
          'components/remote/public/cdn/**/*.js', '!components/remote/public/cdn/**/*.min.js'
         ],
         tasks: ['newer:uglify', 'newer:jshint:client']
      },
      serverJS: {
         files: ['components/**/*.js'],
         tasks: ['newer:jshint:server']
      },
      clientLess: {
         files: [
          'components/web/public/layouts/**/*.less',
          'components/web/public/views/**/*.less',
          'components/web/public/less/**/*.less'
         ],
         tasks: ['newer:less']
      },
      layoutLess: {
        files: [
          'components/web/public/layouts/**/*.less',
          'components/web/public/less/**/*.less',
          'components/remote/public/cdn/**/**/*.less'
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
          'components/web/public/layouts/core.min.js': [
            'components/web/public/vendor/jquery/jquery.js',
            'components/web/public/vendor/jquery.cookie/jquery.cookie.js',
            'components/web/public/vendor/underscore/underscore.js',
            'components/web/public/vendor/backbone/backbone.js',
            'components/web/public/vendor/bootstrap/js/affix.js',
            'components/web/public/vendor/bootstrap/js/alert.js',
            'components/web/public/vendor/bootstrap/js/button.js',
            'components/web/public/vendor/bootstrap/js/carousel.js',
            'components/web/public/vendor/bootstrap/js/collapse.js',
            'components/web/public/vendor/bootstrap/js/dropdown.js',
            'components/web/public/vendor/bootstrap/js/modal.js',
            'components/web/public/vendor/bootstrap/js/tooltip.js',
            'components/web/public/vendor/bootstrap/js/popover.js',
            'components/web/public/vendor/bootstrap/js/scrollspy.js',
            'components/web/public/vendor/bootstrap/js/tab.js',
            'components/web/public/vendor/bootstrap/js/transition.js',
            'components/web/public/vendor/momentjs/moment.js',
            'components/web/public/layouts/core.js'
          ],
          'components/web/public/layouts/ie-sucks.min.js': [
            'components/web/public/vendor/html5shiv/html5shiv.js',
            'components/web/public/vendor/respond/respond.js',
            'components/web/public/layouts/ie-sucks.js'
          ],
          'components/web/public/layouts/admin.min.js': ['components/web/public/layouts/admin.js']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'components/web/public/views/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'components/web/public/views/',
          ext: '.min.js'
        }]
      },
      cdn: {
        files: [{
          expand: true,
          cwd: 'components/remote/public/cdn/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'components/remote/public/cdn/',
          ext: '.min.js'
        }]
      }
    },
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
            'components/web/public/layouts/**/*.min.js',
            'components/web/public/views/**/*.min.js',
            'components/remote/public/cdn/**/*.min.js'
          ]
        },
        src: [
          'components/web/public/layouts/**/*.js',
          'components/web/public/views/**/*.js',
          'components/remote/public/cdn/**/*.js'
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
          'components/web/public/layouts/core.min.css': [
            'components/web/public/less/bootstrap-build.less',
            'components/web/public/less/font-awesome-build.less',
            'components/web/public/layouts/core.less'
          ],
          'components/web/public/layouts/admin.min.css': ['components/web/public/layouts/admin.less'],
          'components/remote/public/cdn/themes/people-basic.min.css': ['components/remote/public/cdn/themes/less/people-basic.less'],
          'components/remote/public/cdn/themes/people-blue.min.css': ['components/remote/public/cdn/themes/less/people-blue.less'],
          'components/remote/public/cdn/themes/people-cards.min.css': ['components/remote/public/cdn/themes/less/people-cards.less']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'components/web/public/views/',
          src: ['**/*.less'],
          dest: 'components/web/public/views/',
          ext: '.min.css'
        }]
      },
      cdn: {
        files: [{
          expand: true,
          cwd: 'components/remote/public/cdn/themes/less/',
          src: ['**/*.less', '!**/shared.less'],
          dest: 'components/remote/public/cdn/themes/',
          ext: '.min.css'
        }]
      }
    },
    clean: {
      js: {
        src: [
          'components/web/public/layouts/**/*.min.js',
          'components/web/public/layouts/**/*.min.js.map',
          'components/web/public/views/**/*.min.js',
          'components/web/public/views/**/*.min.js.map',
          'components/remote/public/cdn/**/*.min.js',
          'components/remote/public/cdn/**/*.min.js.map'
        ]
      },
      css: {
        src: [
          'components/web/public/layouts/**/*.min.css',
          'components/web/public/views/**/*.min.css',
          'components/remote/public/cdn/**/*.min.css'
        ]
      },
      vendor: {
        src: ['components/web/public/vendor/**']
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
