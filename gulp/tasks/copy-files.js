var gulp = require('gulp');

gulp.task('copy-files', ['webpack'], function () {
	return gulp.src([
			'src/ProjectConfig.json',
			'src/index.html',
			'src/bundle.js',
			'src/stylesheet.scss'
		])
		.pipe(gulp.dest('./build'));
});
