if (PRODUCTION) {
	require('stylesheet.scss');
} else {
	require('../stylesheet.scss');
}

require('helpers/pollyfill');
require('helpers/project-helpers').loadWork();
require('event-listeners').add();

var dayHelpers = require('helpers/day-helpers');
var globals = require('globals');
dayHelpers.updateDaysPerPage(globals.daysPerPage());
dayHelpers.updateFirstDay(globals.firstDay());

require('dateline').draw();
var projectDraw = require('project-draw');
projectDraw.init(require('helpers/day-helpers.js'));
projectDraw.draw();


var test = 'testing';
module.exports.test = test;