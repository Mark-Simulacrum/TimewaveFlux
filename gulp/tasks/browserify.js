/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   If the watch task is running, this uses watchify instead
   of browserify for faster bundling using caching.
*/

var browserify = require('browserify');
var bundleLogger = require('../util/logger');
var gulp = require('gulp');
var handleErrors = require('../util/handleErrors');
var source = require('vinyl-source-stream');

gulp.task('browserify', function () {

	var bundler = browserify({
		entries: ['./src/scripts/entry-point.js'],
		cache: {},
		packageCache: {},
		debug: true
	});

	bundler.plugin('minifyify', {map: 'bundle.map.json', output: 'build/bundle.map.json'});

	var bundle = function () {
		// Log when bundling starts
		bundleLogger.start();

		return bundler
			.bundle()
			// Report compile errors
			.on('error', handleErrors)
			// Use vinyl-source-stream to make the
			// stream gulp compatible. Specifiy the
			// desired output filename here.
			.pipe(source('app.js'))
			// Specify the output destination
			.pipe(gulp.dest('./build/'))
			// Log when bundling completes!
			.on('end', bundleLogger.end);
	};

	return bundle();
});
