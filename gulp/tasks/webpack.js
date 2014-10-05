var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var webpackConfig = require('../../webpack.config.js');

gulp.task('webpack', function (callback) {
	// modify some webpack config options
	var myConfig = Object.create(webpackConfig);
	myConfig.plugins = (myConfig.plugins || []).concat(
		new webpack.DefinePlugin({
			PRODUCTION: true
		}),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin()
	);

	// run webpack
	webpack(myConfig, function(err, stats) {
		if(err) {
			throw new gutil.PluginError('webpack:build', err);
		}
		gutil.log('[webpack:build]', stats.toString());
		callback();
	});
});
