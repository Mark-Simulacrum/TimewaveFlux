var gulp = require('gulp');
// var connect = require('gulp-connect');
var sass = require('gulp-ruby-sass');


// gulp.task('connect', function() {
// 	connect.server({
// 		root: ['.'],
// 		livereload: true
// 	});
// });

// gulp.task('connect-reload', function () {
//   gulp.src('./*.html')
//     .pipe(connect.reload());
// });

gulp.task('sass', function() {
	return gulp.src('stylesheet.scss')
		.pipe(sass({noCache: true}))
		.pipe(gulp.dest('.'));
});

gulp.task('watch', function () {
	// gulp.watch(['index.html', 'javascript.js', 'stylesheet.css'], ['connect-reload']);
	gulp.watch(['stylesheet.scss'], ['sass']);
});

gulp.task('default', ['watch']);
