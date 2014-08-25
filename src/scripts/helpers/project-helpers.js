var projects = [];

var globals = require('../globals');
var Project = require('../Project').Project;

var dayHelpers = require('./day-helpers');
var dateHelpers = require('./date-helpers');
var footer = require('../footer');

function setProjects(newProjects) {
	projects = newProjects;
	module.exports.projects = projects;
	global.projects = projects;
}

function saveableProjects() {
	var array = [];
	for (var i = 0; i < projects.length; i++) {
		var project = projects[i];

		var convertedDayLoad = {};

		for (var day = 0; day < project.dayLoad.length; day++) {
			convertedDayLoad[dateHelpers.fromDayToString(project.start() + day)] = project.dayLoad[day];
		}

		array.push({
			name: project.name,
			customerName: project.customerName,
			deadline: dateHelpers.fromDayToString(project.deadline),
			size: project.size,
			color: project.color,
			dayLoad: convertedDayLoad,
			workDone: project.workDone
		});
	}
	return array;
}

function loadProjects(savedProjects) {
	var newProjects = [];
	var i;
	if (savedProjects === undefined || savedProjects === null || savedProjects.length === 0) { // Load projects from configuration
		var request = new XMLHttpRequest();
		request.open('GET', '/ProjectConfig.json', false);
		request.send();
		savedProjects = JSON.parse(request.responseText);
		for (i = 0; i < savedProjects.length; i++) {
			newProjects.push(new Project(savedProjects[i]));
		}

		return newProjects;
	}

	for (i = 0; i < savedProjects.length; i++) { // Is needed to preserve Project prototypes.
		newProjects.push(new Project(savedProjects[i]));
	}
	return newProjects;
}

function setupLocalStorage() {
	if (!localStorage.savedProjects) {
		footer.notify('Saving current work as first work saved.');
		localStorage.savedProjects = JSON.stringify([]); // Set this to empty array, below logic will handle
	}

	if (!localStorage.currentVersion) {
		footer.notify('No current version, defaulting to last element.');
		var futureCurrentVersion = JSON.parse(localStorage.savedProjects).length - 1;
		localStorage.currentVersion = futureCurrentVersion >= 0 ? futureCurrentVersion : 0;
	}
}

function saveWork() {
	if (globals.debug()) return;
	setupLocalStorage();

	var currentVersion = Number(localStorage.currentVersion);
	var savedProjects = JSON.parse(localStorage.savedProjects);
	var currentProjects = saveableProjects();

	if (!savedProjects) savedProjects = [];
	if (JSON.stringify(savedProjects[currentVersion]) === JSON.stringify(currentProjects)) return; // If we the saved work is the same as the current work, we can exit.

	savedProjects = savedProjects.slice(0, currentVersion + 1); // Add 1 bc slice removes currVer otherwise. // Removes anything past currentVersion.
	savedProjects.push(currentProjects); // Add current projects to savedProjects

	localStorage.savedProjects = JSON.stringify(savedProjects);
	localStorage.currentVersion = savedProjects.length - 1;
	updateVersionElement();
}

function updateVersionElement() {
	document.getElementById('version').innerHTML = 'v' + localStorage.currentVersion;
}

module.exports.updateVersionElement = updateVersionElement;

function loadWork() {
	var savedProjects;
	setupLocalStorage();

	if (globals.debug()) {
		savedProjects = null;
	} else {
		var currentVersion = Number(localStorage.currentVersion); // localStorage contains string, we should convert to number
		savedProjects = JSON.parse(localStorage.savedProjects)[currentVersion];
	}

	updateVersionElement();
	setProjects(loadProjects(savedProjects));
}

module.exports.getProjects = function (dayNo) {
	var foundProjects = [];

	for (var i = 0; i < projects.length; i++) {
		var project = projects[i];
		if (project.start() <= dayNo && dayNo < project.end()) { // project.end == project.deadline + 1
			foundProjects.push(project);
		}
	}

	return foundProjects;
};

module.exports.getProjectByCoordinates = function getProjectByCoordinates(x, y) {
	var dayNo = dayHelpers.getDay(x);
	var foundProjects = this.getProjects(dayNo);
	for (var i = 0; i < foundProjects.length; i++) {
		var project = foundProjects[i];
		var relativeDayNo = project.relativeDayNo(dayNo);

		// Add headerCtx canvas height to fix coordinates.
		if (project.y[relativeDayNo] + globals.headerCtx.canvas.clientHeight < y && y < project.maxY(dayNo) + globals.headerCtx.canvas.clientHeight) {
			return project;
		}
	}

	return false;
};

module.exports.projects = projects;
module.exports.setProjects = setProjects;
module.exports.loadProjects = loadProjects;
module.exports.loadWork = loadWork;
module.exports.saveWork = saveWork;
module.exports.saveableWork = saveableProjects;

global.loadWork = loadWork;
global.saveWork = saveWork;
