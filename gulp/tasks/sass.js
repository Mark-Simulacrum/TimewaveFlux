var gulp = require('gulp');
var sass = require('gulp-sass');
var handleErrors = require('../util/handleErrors');

gulp.task('sass', function () {
  return gulp.src('src/css/**/*.scss')
    .pipe(sass({
		sourceComments: 'normal'
	}))
    .on('error', handleErrors)
    .pipe(gulp.dest('build'));
});
