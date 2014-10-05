var jshint = require('gulp-jshint');
var gulp = require('gulp');

gulp.task('jshint', function () {
	return gulp.src(['**/*.js', '!build/**', '!src/bundle.js', '!node_modules/**'])
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
});
