/* Notes:
   - gulp/tasks/browserify.js handles js recompiling with watchify
     that change within the directory it's serving from
*/

var gulp = require('gulp');

gulp.task('watch', ['build', 'setWatch'], function() {
  gulp.watch('src/css/**/*.scss', ['sass']);
  gulp.watch('src/**/*.html', ['html']);
  gulp.watch('src/**/*.js', ['jshint', 'browserify']);
});
