var gulp = require('gulp');
var connect = require('gulp-connect');


gulp.task('connect', function() {
	connect.server({
		root: ['.'],
		livereload: true
	});
});

gulp.task('connect-reload', function () {
  gulp.src('./**')
    .pipe(connect.reload());
});

gulp.task('connect-reload', function() {
	connect.reload();
});

gulp.task('watch', function () {
	gulp.watch(['index.html', 'javascript.js'], ['connect-reload'])
});

gulp.task('default', ['connect', 'watch']);
// gulp.task('default', ['connect']);