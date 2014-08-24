var globals = require('./globals');

var dayHelpers = require('./helpers/day-helpers');
var dateHelpers = require('./helpers/date-helpers');
var projectHelpers = require('./helpers/project-helpers');
var projectCanvas = require('./helpers/project-canvas-helpers');

var ctx = globals.ctx;
var dayWidth = dayHelpers.dayWidth;

function drawBorder(dayNo) {
	var x = dayHelpers.leftBorder(dayNo);
	if (dayNo == globals.now) {
		ctx.fillStyle = 'red';
	}
	else
	{
		ctx.fillStyle = 'black';
	}
	if (dayNo == globals.firstDay() + globals.daysPerPage()) {
		--x; // Drawing on canvas cannot be done at canvas width.
	}
	ctx.fillRect(x, 0, globals.borderWidth, ctx.canvas.clientHeight);
}

function drawProjects(dayNo) {
	var foundProjects = projectHelpers.getProjects(dayNo);
	var clicked = projectCanvas.clicked();

	if (clicked && clicked.project && !foundProjects.contains(clicked.project)) {
		foundProjects.push(clicked.project);
	}

	var offsetTop = globals.dayTitleHeight;

	for (var i = 0; i < foundProjects.length; i++) {
		offsetTop = foundProjects[i].draw(dayNo, offsetTop); // Returns the new offsetTop
	}
}

function drawDays() {
	var lastDay = globals.firstDay() + globals.daysPerPage();

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas for redrawing

	for (var dayNo = globals.firstDay(); dayNo < lastDay; dayNo++) {
		if (dayNo < globals.now) {
			ctx.fillStyle = 'lightgray';
			ctx.fillRect(dayHelpers.dayStart(dayNo), 0, dayWidth(), ctx.canvas.height);
		}

		var clicked = projectCanvas.clicked();

		if (clicked && clicked.project.start() <= dayNo && dayNo <= clicked.project.deadline) {
			ctx.fillStyle = 'rgba(0, 153, 74, 0.2)';
			ctx.fillRect(dayHelpers.dayStart(dayNo), 0, dayHelpers.dayWidth(), ctx.canvas.height);
		}


		ctx.font = globals.fontStack;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'black';
		ctx.fillText((globals.debug ? dayNo + ' ' : '') + dateHelpers.dateText(dayNo, true), dayHelpers.dayStart(dayNo) + dayWidth() / 2, globals.dayTitleHeight / 2 + globals.borderWidth, dayWidth());

		drawProjects(dayNo);
		drawBorder(dayNo);
	}

	// Draw lines across
	ctx.fillStyle = 'black';

	ctx.fillRect(0, 0, ctx.canvas.clientWidth, globals.borderWidth); // Dateline seperator
	ctx.fillRect(0, globals.dayTitleHeight, ctx.canvas.clientWidth, globals.borderWidth); // Header seperator
	ctx.fillRect(0, globals.daySize * globals.workUnitHeight + globals.dayTitleHeight, dayHelpers.leftBorder(lastDay), globals.borderWidth); // daySize line
	ctx.fillRect(0, ctx.canvas.height - 1, ctx.canvas.clientWidth, globals.borderWidth); // Footer seperator

	drawBorder(lastDay);
}

module.exports.draw = function () {
	globals.ctx.canvas.width = window.innerWidth;
	globals.ctx.canvas.height = document.body.clientHeight - globals.footer.clientHeight - globals.headerCtx.canvas.clientHeight;

	drawDays();
};
