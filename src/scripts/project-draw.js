var projectHelpers = require('./helpers/project-helpers');
var dateHelpers = require('./helpers/date-helpers');
var globals = require('./globals');
var footer = require('./footer');

var projectContainer = document.getElementById('projectContainer');
var clicked, clickedStart, selectedProject;

function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function getColumnElement(dayNo) {
	var column = document.querySelector('.column[dayno="' + dayNo + '"]');

	if (!column) {
		column = document.createElement('div');
		column.classList.add('column');
		column.setAttribute('dayNo', dayNo);

		if (dayNo < globals.now) {
			column.classList.add('beforeNow');
		}

		var columnHeader = document.createElement('div');
		columnHeader.classList.add('header');
		columnHeader.innerHTML = dateHelpers.dateText(dayNo, true) + (globals.debug() ? ' - ' + dayNo : '');

		column.appendChild(columnHeader);

		var columnProjectContainer = document.createElement('div');
		columnProjectContainer.classList.add('projectContainer');
		column.appendChild(columnProjectContainer);

		var prevDayProjectColumn = projectContainer.querySelector('.column[dayno="' + (dayNo - 1) + '"]');
		var nextDayProjectColumn = projectContainer.querySelector('.column[dayno="' + (dayNo + 1) + '"]');

		if (nextDayProjectColumn) {
			projectContainer.insertBefore(column, nextDayProjectColumn);
		} else if (prevDayProjectColumn) {
			insertAfter(column, prevDayProjectColumn);
		} else if (projectContainer.innerHTML === '') {
			projectContainer.appendChild(column);
		} else {
			projectContainer.insertBefore(column, projectContainer.querySelector('.column:first-child'));
		}
	}

	column.style.width = 100 / globals.daysPerPage() + '%';
	column.querySelector('.projectContainer').style.height = column.clientHeight - column.querySelector('.header').clientHeight + 'px';

	return column;
}

function getProjectCanvas(dayNo, project) {
	var column = getColumnElement(dayNo);
	var projectCanvas = column.querySelector('.project[projectid="' + project.projectID + '"]');

	if (!projectCanvas) {
		projectCanvas = document.createElement('canvas');
		projectCanvas.classList.add('project');
		projectCanvas.setAttribute('projectid', project.projectID);

		projectCanvas.addEventListener('mouseenter', function () {
			project.drawLadder(projectCanvas.getContext('2d'), dayNo);
		}, false);

		projectCanvas.addEventListener('mouseleave', function () {
			project.drawToCanvas(projectCanvas, dayNo);
		}, false);

		column.querySelector('.projectContainer').appendChild(projectCanvas);

		projectCanvas.style.backgroundColor = project.color;
	}

	return projectCanvas;
}

function drawProjects(dayNo) {
	var validProjectIDs = [];
	var column = getColumnElement(dayNo);
	var projects = projectHelpers.getProjects(dayNo);

	if (projects.length > 0) {
		for (var projectNo = 0; projectNo < projects.length; projectNo++) {

			var project = projects[projectNo];

			validProjectIDs.push(project.projectID);

			project.drawToCanvas(getProjectCanvas(dayNo, project), dayNo);
		}
	}

	var projectElements = column.querySelectorAll('.project');

	for (var i = 0; i < projectElements.length; i++) {
		if (!validProjectIDs.contains(Number(projectElements[i].getAttribute('projectid')))) {
			projectElements[i].parentElement.removeChild(projectElements[i]);
		}
	}
}

function draw() {
	console.time('drawing...');

	document.querySelector('.columns').style.height =
		document.body.clientHeight - document.querySelector('footer').clientHeight - document.querySelector('#header-canvas').clientHeight + 'px';

	var columns = document.querySelectorAll('.columns .column');

	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		var columnDayNo = Number(column.getAttribute('dayno'));
		if (columnDayNo < globals.firstDay() || columnDayNo >= globals.firstDay() + globals.daysPerPage())
			column.parentElement.removeChild(column);
	}

	for (var dayNo = globals.firstDay(); dayNo < globals.firstDay() + globals.daysPerPage(); dayNo++) {
		getColumnElement(dayNo);
		drawProjects(dayNo);
	}

	console.timeEnd('drawing...');
}

function updateProjectRange(rangeStart, rangeEnd) {
	for (var dayNo = rangeStart; dayNo <= rangeEnd; dayNo++) {
		drawProjects(dayNo);
	}
}

/**
 * updateColumnRange
 * @param {Number} rangeStart - dayNo
 * @param {Number} rangeEnd - dayNo
 */
function updateColumnRange(rangeStart, rangeEnd) {
	for (var dayNo = rangeStart; dayNo <= rangeEnd; dayNo++) {
		var projectColumn = getColumnElement(dayNo);

		if (projectColumn.classList.contains('withinSelectedProject')) {
			projectColumn.classList.remove('withinSelectedProject');
		}

		if (selectedProject && selectedProject.project.start() <= dayNo && dayNo <= selectedProject.project.deadline) {
			projectColumn.classList.add('withinSelectedProject');
		}
	}

	updateProjectRange(rangeStart, rangeEnd);
}

module.exports.init = function (dayHelpers) {
	window.addEventListener('resize', draw);

	projectContainer.addEventListener('mousedown', function (event) {
		var mouse = {
			x: event.x,
			y: event.y
		};

		var project = projectHelpers.projects[event.toElement.getAttribute('projectid')];
		var dayNo = dayHelpers.getDay(mouse.x);

		if (project) {
			var mouseLoad = project.mouseLoad(dayNo, mouse.y, event.toElement);

			clicked = {
				project: project,
				current: dayNo, // In the case that the user doesn't move mouse after clicking
				previous: dayNo, // The Place we were before is here, since nothing was clicked previously.
				load: project.load(dayNo) > 15 ? Math.min(Math.ceil(mouseLoad / 15) * 15, project.load(dayNo)) : project.load(dayNo), // the current 15 minute section of project (and below)
				shift: event.shiftKey,
				ctrl: event.ctrlKey,
			};

			selectedProject = {
				project: project,
				dayClicked: dayNo,
				load: mouseLoad - mouseLoad % 15, // Makes mouseLoad in 15 min divisible chunks
				ctrl: event.ctrlKey
			};

			updateColumnRange(selectedProject.project.start(), selectedProject.project.deadline);

			footer.addSelectedInfo(selectedProject);
		} else if (selectedProject) { // Clear selected project if clicking whitespace.
			var projectStart = selectedProject.project.start();
			var projectDeadline = selectedProject.project.deadline;
			selectedProject = null;
			updateColumnRange(projectStart, projectDeadline);
			footer.addSelectedInfo(selectedProject);
		} else {
			clickedStart = dayNo;
		}

	}, false);

	projectContainer.addEventListener('mouseup', function () {
		if (clicked) {
			projectHelpers.saveWork();
			clicked = null;
		}

		if (clickedStart) {
			clickedStart = null;
		}
	}, false);

	projectContainer.addEventListener('mousemove', function (event) {
		var dayNo = dayHelpers.getDay(event.x);

		if (clickedStart) {
			dayHelpers.updateFirstDay(globals.firstDay() + clickedStart - dayHelpers.getDay(event.x));
		}

		if (!clicked) { // Nothing being moved, we are done.
			return;
		}

		clicked.ctrl = event.ctrlKey; // Allows people to ctrl & shift states while clicking.
		clicked.shift = event.shiftKey;

		clicked.project.updateDayLoad(dayNo); // Checks if stuff needs to be changed, changes it, and draws.
	});
};

module.exports.clicked = function () {
	return clicked;
};

module.exports.selectedProject = function () {
	return selectedProject;
};

module.exports.draw = draw;
module.exports.drawProjects = drawProjects;
module.exports.getColumnElement = getColumnElement;
