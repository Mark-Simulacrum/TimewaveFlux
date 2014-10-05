var webpack = require('webpack');
module.exports = {
	entry: './src/scripts/entry-point.js',
	output: {
		path: './src',
		filename: 'bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.scss$/,
				loader: 'style!css!autoprefixer!sass?outputStyle=compressed'
			}
		]
	},
	resolve: {
		modulesDirectories: [
			'node_modules',
			'src/scripts'
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			PRODUCTION: false
		})
	]
};
