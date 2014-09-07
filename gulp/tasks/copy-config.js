var gulp = require('gulp');

gulp.task('copy-config', function () {
	return gulp.src('./ProjectConfig.json')
		.pipe(gulp.dest('./build'));
});
