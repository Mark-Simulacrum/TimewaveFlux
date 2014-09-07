var gulp = require('gulp');
var buildBranch = require('buildbranch');
var exec = require('child_process').exec;

gulp.task('publish', ['build'], function (done) {
	exec('git log -n 1 --pretty=%H', function (error, stdout) {
		var lastCommitHash = stdout;

		buildBranch({
			folder: 'build',
			commit: 'Published from @ ' + lastCommitHash
		}, done);
	});
});
