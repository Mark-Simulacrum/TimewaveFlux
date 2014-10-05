var gulp = require('gulp');

gulp.task('copy-files', function () {
	return gulp.src([
			'src/ProjectConfig.json',
			'src/index.html',
			'src/bundle.js'
		])
		.pipe(gulp.dest('./build'));
});
