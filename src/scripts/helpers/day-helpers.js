var globals = require('../globals');

var borderWidth = globals.borderWidth;

var dateHelpers = require('./date-helpers');
var toMoment = dateHelpers.toMoment;
var footer = require('..//footer');

var projectHelpers = require('./project-helpers');
var drawing = require('../project-canvas-draw');


function dayLoad(dayNo) {
	var accumulatedLoad = 0;

	var projects = projectHelpers.projects;

	for (var i = 0; i < projects; i++) {
		var project = projects[i];
		if (project.start() <= dayNo && dayNo < project.end()) {
			accumulatedLoad += project.load(dayNo - project.start());
		}
	}

	return accumulatedLoad;
}

function leftBorder(dayNo) {
	return (dayNo - globals.firstDay()) * globals.fullDayWidth();
}

function dayWidth() {
	return globals.fullDayWidth() - borderWidth;
}

function dayStart(dayNo) {
	return leftBorder(dayNo) + borderWidth;
}

function dayEnd(dayNo) {
	return dayStart(dayNo) + dayWidth();
}

function getDay(offsetLeft) {
	var day = Math.floor(offsetLeft / globals.fullDayWidth()) + globals.firstDay();
	if (day < 0 || isNaN(day)) day = 0;
	return day;
}

function updateDaysPerPage(newValue) {
	if (newValue > 0) {
		if (typeof newValue != 'number') newValue = Number(newValue); // Make sure that newValue is a Number.
		globals.daysPerPage(newValue);
		document.getElementById('day_amount').value = globals.daysPerPage();
		drawing.draw();
	}
}

function updateFirstDay(newValue) {
	if (typeof newValue != 'number') newValue = Number(newValue);

	var oldValue = globals.firstDay();

	if (newValue < 0) {
		footer.notify('Setting firstDay to the start of time... attempted setting of date before the start of time.');
		globals.firstDay(0);
	} else if (newValue > globals.dayCount) {
		footer.notify('Setting firstDay to the end of time... attempted setting of date after the end of time.');
		globals.firstDay(globals.dayCount);
	} else { // Everything is OK
		globals.firstDay(newValue);
	}

	if (globals.firstDay() != oldValue) {
		footer.notify('First day has been moved ' + toMoment(globals.firstDay()).from(toMoment(oldValue), true) + (toMoment(globals.firstDay()).isAfter(toMoment(oldValue)) ? ' in the future.' : ' into the past.'));
	}

	document.getElementById('date').value = dateHelpers.fromDayToString(globals.firstDay());
	drawing.draw();
}

module.exports = {
	dayLoad: dayLoad,
	leftBorder: leftBorder,
	dayStart: dayStart,
	dayEnd: dayEnd,
	dayWidth: dayWidth,
	getDay: getDay,
	updateDaysPerPage: updateDaysPerPage,
	updateFirstDay: updateFirstDay
};
