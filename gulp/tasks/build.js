var gulp = require('gulp');

gulp.task('build', ['jshint', 'webpack', 'copy-files']);
