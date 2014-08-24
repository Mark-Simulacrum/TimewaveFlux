var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('server', function () {
	gulp.src('.')
	.pipe(webserver({
		livereload: true,
		host: '0.0.0.0',
		port: 8080,
		open: true,
		directoryListing: true
	}));
});
