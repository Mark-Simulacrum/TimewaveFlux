var gulp = require('gulp');

gulp.task('watch', ['build', 'setWatch'], function() {
  gulp.watch('src/css/**/*.scss', ['sass']);
  gulp.watch('src/**/*.html', ['html']);
  gulp.watch('src/**/*.js', ['jshint', 'browserify']);
  gulp.watch('./ProjectConfig.js', ['copy-config']);
});
