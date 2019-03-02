module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({
    clean: ['dist'],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss', 'vendor/**'],
        dest: 'dist',
      },
      pluginDef: {
        expand: true,
        src: ['README.md'],
        dest: 'dist',
      },
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*'],
        tasks: ['default'],
        options: { spawn: false },
      },
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['env'],
        plugins: ['transform-object-rest-spread'],
      },
      dist: {
        files: [
          {
            cwd: 'src',
            expand: true,
            src: ['**/*.js', '!vendor/**'],
            dest: 'dist',
            ext: '.js',
          },
        ],
      },
    },
  });

  grunt.registerTask('default', ['clean', 'copy:src_to_dist', 'copy:pluginDef', 'babel']);
};
