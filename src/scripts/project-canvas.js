var globals = require('./globals');

var projectHelpers = require('./projects');
var dayHelpers = require('./day-helpers');

var drawing = require('./project-canvas-draw');

var clicked, clickedStart, moused, selectedProject;

module.exports.eventEmitter = new (require('events')).EventEmitter();

var eventEmitter = module.exports.eventEmitter;

module.exports.init = function () {
	var canvas = globals.ctx.canvas;

	window.addEventListener('resize', drawing.draw);

	canvas.addEventListener('mousedown', function (event) {
		var mouse = {
			x: event.x,
			y: event.y
		};

		var project = projectHelpers.getProjectByCoordinates(mouse.x, mouse.y);
		var dayNo = dayHelpers.getDay(mouse.x);

		if (project) {
			var mouseLoad = project.mouseLoad(dayNo, mouse.y);

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

			eventEmitter.emit('selectedProjectChanged', selectedProject);
			eventEmitter.emit('clickedChanged', clicked);

			drawing.draw();
		} else if (selectedProject) { // Clear selected project if clicking whitespace.
			selectedProject = null;
			eventEmitter.emit('selectedProjectChanged', selectedProject);
			drawing.draw();
		} else {
			clickedStart = dayNo;
		}

	}, false);

	canvas.addEventListener('mouseup', function (event) {
		globals.footer.classList.remove('noSelect');

		if (clicked) {
			projectHelpers.saveWork();
			clicked = null;

			eventEmitter.emit('clickedChanged', clicked);

			drawing.draw();
		}

		if (clickedStart) {
			dayHelpers.updateFirstDay(globals.firstDay() + clickedStart - dayHelpers.getDay(event.x));
			clickedStart = null;
		}
	}, false);

	canvas.addEventListener('mousemove', function (event) {
		var mouse = {
			x: event.x,
			y: event.y
		};

		var project = projectHelpers.getProjectByCoordinates(mouse.x, mouse.y);
		var dayNo = dayHelpers.getDay(mouse.x);

		if (moused && (moused.project != project || moused.day != dayNo)) { // If we changed days or projects, we need to erase the old lines.
			moused = null;
			drawing.draw();
		}

		if (project) { // && !selectedProject) {
			project.drawLadder(dayNo);

			moused = {
				project: project,
				day: dayNo
			};
		}
		if (clickedStart) {
			dayHelpers.updateFirstDay(globals.firstDay + clickedStart - dayNo);
		}

		if (!clicked) { // Nothing being moved, we are done.
			return;
		}

		clicked.ctrl = event.ctrlKey; // Allows people to ctrl & shift states while clicking.
		clicked.shift = event.shiftKey;

		eventEmitter.emit('clickedChanged', clicked);

		clicked.project.updateDayLoad(dayNo); // Checks if stuff needs to be changed, changes it, and draws.
	});
};

module.exports.clicked = function () {
	return clicked;
};

module.exports.selectedProject = function () {
	return selectedProject;
};

module.exports.moused = function () {
	return moused;
};
