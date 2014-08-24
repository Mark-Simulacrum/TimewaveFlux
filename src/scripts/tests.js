var globals = require('./globals');
var projects = require('./projects');
var assert = require('assert');

module.exports.everythingIsOkay = function everythingIsOkay() {
	for (var i = projects.length - 1; i >= 0; i--) {
		assert(projects[i].test(), projects[i].name + ' is OK.');
	}

	assert(globals.firstDay() >= 0, 'First day is OK.');

	return true;
};
