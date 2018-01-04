// Gruntfile.js

module.exports = (grunt) => {
  grunt.initConfig({
    execute: {
      target: { 
        src: ['server.js'] 
      }
    }, 
    watch: {  
      scripts: { 
        files: ['*.js'],
        tasks: ['execute'], 
      }, 
      options: {
        spawn: true,
        livereload: {
          options: { livereload: true, spawn: true },
          files: ['build/**/*.{css,js}']
        },
        files: ['build/**/*.{css,js}'] 
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-execute');
};