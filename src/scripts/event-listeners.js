var globals = require('./globals');
var dateHelpers = require('./helpers/date-helpers');
var projectCanvas = require('./helpers/project-canvas-helpers');
var projects = require('./helpers/project-helpers');
var dayHelpers = require('./helpers/day-helpers');
var footer = require('./footer');
var drawing = require('./project-canvas-draw');

var timeToWork = dateHelpers.timeToWork;

var updateFirstDay = dayHelpers.updateFirstDay;
var updateDaysPerPage = dayHelpers.updateDaysPerPage;

var saveAs = require('browser-filesaver');

var fromMoment = dateHelpers.fromMoment;

module.exports.add = function () {
	var projectInput = document.querySelector('footer .project #workInput');

	var buttonDone = document.getElementById('done');
	var dateInput = document.getElementById('date');

	//	 If in project section, no need to check for selectedProject as we cannot click anything there w/o selecting a project.
	buttonDone.addEventListener('click', function () {
		if (projectInput.value === 0 || !projectInput.value) return;

		var selectedProject = projectCanvas.selectedProject();
		var inputWorkUnits = timeToWork(projectInput.value);

		if (inputWorkUnits < 0 && -inputWorkUnits > selectedProject.project.workDone) {
			footer.notify('Input of ' + projectInput.value + ' is subtracting too much from the current amount of finished work. Please change.');
			return;
		}

		if (selectedProject.project.workDone + inputWorkUnits > selectedProject.project.size()) {
			var answer = confirm('Do you wish to mark ' + selectedProject.project.name + ' completely done?');
			if (answer) {
				inputWorkUnits = selectedProject.project.size() - selectedProject.project.workDone;
			} else {
				return;
			}
		}

		selectedProject.project.workDone += inputWorkUnits;
		projectInput.value = '';

		projectCanvas.eventEmitter.emit('selectedProjectChanged', selectedProject);

		projects.saveWork();
		drawing.draw();
	}, false);

	document.getElementById('spread').addEventListener('click', function () {
		var selectedProject = projectCanvas.selectedProject();
		selectedProject.project.spread();
	}, false);

	document.getElementById('collapse').addEventListener('click', function () {
		var selectedProject = projectCanvas.selectedProject();
		selectedProject.project.collapse(selectedProject.dayClicked);
	}, false);

	document.getElementById('change-work').addEventListener('click', function () {
		if (projectInput.value === 0 || !projectInput.value) return;
		var selectedProject = projectCanvas.selectedProject();

		var inputWorkUnits = timeToWork(projectInput.value);

		selectedProject.project.changeWork(inputWorkUnits);
	}, false);

	document.getElementById('project_center').addEventListener('click', function () {
		var selectedProject = projectCanvas.selectedProject();
		var project = selectedProject.project;
		var middleDay = globals.firstDay() + globals.daysPerPage() / 2;
		var middleProject = project.firstWork() + project.dayLoadLength() / 2;

		updateFirstDay(globals.firstDay() + Math.floor(middleProject - middleDay));
	}, false);
	document.getElementById('project_start').addEventListener('click', function () {
		var selectedProject = projectCanvas.selectedProject();
		updateFirstDay(selectedProject.project.start());
	}, false);
	document.getElementById('project_deadline').addEventListener('click', function () {
		var selectedProject = projectCanvas.selectedProject();
		updateFirstDay(selectedProject.project.end() - globals.daysPerPage);
	}, false);

	document.getElementById('change_start-deadline').addEventListener('click', function () {
		var selectedProject = projectCanvas.selectedProject();
		var project = selectedProject.project;
		var newStart = dateHelpers.fromDateToMoment(document.getElementById('start').value);
		var newDeadline = dateHelpers.fromDateToMoment(document.getElementById('deadline').value);

		project.changeStart(newStart);
		project.changeDeadline(newDeadline);

		footer.eventEmitter.emit('selectedProjectChanged', project);
	}, false);

	dateInput.addEventListener('change', function () {
		updateFirstDay(dateHelpers.fromDateToMoment(dateInput.value));
	}, false);

	document.getElementById('date_minus_31').addEventListener('click', function () {
		updateFirstDay(globals.firstDay() - 31);
	}, false);
	document.getElementById('date_minus_7').addEventListener('click', function () {
		updateFirstDay(globals.firstDay() - 7);
	}, false);
	document.getElementById('date_minus_1').addEventListener('click', function () {
		updateFirstDay(globals.firstDay() - 1);
	}, false);
	document.getElementById('date_add_1').addEventListener('click', function () {
		updateFirstDay(globals.firstDay() + 1);
	}, false);
	document.getElementById('date_add_7').addEventListener('click', function () {
		updateFirstDay(globals.firstDay() + 7);
	}, false);
	document.getElementById('date_add_31').addEventListener('click', function () {
		updateFirstDay(globals.firstDay() + 31);
	}, false);

	document.getElementById('day_amount').addEventListener('change', function (e) {
		updateDaysPerPage(e.target.value);
	}, false);

	document.getElementById('today').addEventListener('click', function () {
		updateFirstDay(fromMoment(globals.now) - Math.floor(globals.daysPerPage / 2));
	}, false);

	document.getElementById('undo').addEventListener('click', function () {
		if (localStorage.currentVersion > 0) {
			--localStorage.currentVersion;
			projectCanvas.loadWork();
			drawing.draw();
		} else {
			footer.notify('Cannot undo from version 0.');
		}
	}, false);

	document.getElementById('redo').addEventListener('click', function () {
		if (localStorage.currentVersion - 1 < JSON.parse(localStorage.savedProjects).length) { // At least 2 less than the amount of history
			++localStorage.currentVersion;
			projectCanvas.loadWork();
			drawing.draw();
		} else {
			footer.notify('Cannot go past the last saved work.');
		}
	}, false);

	document.getElementById('export').addEventListener('click', function () {
		var blob = new Blob([JSON.stringify(projects.saveableProjects(), undefined, 4)], {
			type: 'text/json;charset=utf-8'
		});
		saveAs(blob, 'ProjectConfig-exported.json');
	}, false);

	document.getElementById('import').addEventListener('click', function () {
		document.getElementById('import_input').click();
	}, false);

	document.getElementById('import_input').addEventListener('change', function (event) {
		var file = event.target.files[0];
		if (file) {
			var reader = new FileReader();

			reader.onloadstart = function () {
				footer.notify('Starting file upload of ' + file.name);
			};

			reader.onload = function () {
				footer.notify('Finished file upload of ' + file.name);
				var fileContent = reader.result;
				projects.loadProjects(JSON.parse(fileContent));
				document.getElementById('import_input').value = ''; // Clear the input so that calls change event is called even when file name has not changed
			};

			reader.readAsText(file); // Actually read the file
		}
	}, false);

	document.querySelector('footer').addEventListener('mouseenter', function (event) {
		event.target.classList.remove('noSelect');
	}, false);

	document.querySelector('footer').addEventListener('mouseleave', function (event) {
		event.target.classList.add('noSelect');
	}, false);
};
