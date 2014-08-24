/* jshint ignore:start */
'use strict';

var selectedProject, clicked, moused, ctx, headerCtx, screenWidth, screenHeight, fullDayWidth, __measuretext_cache__, clickedStart,
	footer, header, undoButton, exportButton, importButton, scrollbar,
	fontStack = '12pt Arial',

	mouse = {
		x: 0,
		y: 0
	},

	debug,

	dayCount = 356 * 100,

	// In Pixels
	dayTitleHeight = 20,
	borderWidth = 1,
	workUnitHeight = 1,
	minimumWork = 20,

	daySize = 8 * 60, // In minutes

	calendarFormat = 'YYYY/MM/DD',
	calendarStart = '2014/08/01',
	now = 0,
	firstDay = now,
	daysPerPage = 11,
	projects = [];

dateline.sections = (dateline.monthDots + dateline.weekDots + dateline.dayDots) * 2;
dateline.midPoint = Math.floor(dateline.sections / 2);

document.addEventListener('DOMContentLoaded', init, false);

function init() // TODO: Clean up codebase for init()
{
	debug = window.location.hash.indexOf('debug');

	footer = document.querySelector('footer');
	headerCtx = document.getElementById('header-canvas').getContext('2d');
	ctx = document.getElementById('main-canvas').getContext('2d');

	loadWork();
	displayVersion();

	now = fromMoment(moment());

	updateDaysPerPage(14);
	updateFirstDay(0);

	addEventListeners();
	if (!debug) document.getElementById('today').click(); // Sets today to be in middle of screen on project load

	hideSelectedInfo();

	window.addEventListener('resize', onResizeWindow, false);
	onResizeWindow(); // Call this to initially set all the DOM sizes.

	headerCtx.canvas.addEventListener('mousemove', function (mouseEvent)
	{
		tooltip(screenWidth / 2, headerCtx.canvas.clientHeight, 'Selected change in first day: ' + (getDatelineDayDifference(mouseEvent.pageX || mouseEvent.clientX)));
	}, false);

	headerCtx.canvas.addEventListener('click', function (mouseEvent)
	{
		updateFirstDay(firstDay + getDatelineDayDifference(mouseEvent.pageX || mouseEvent.clientX));
	}, false);

	headerCtx.canvas.addEventListener('mouseleave', function ()
	{
		clearTooltip();
	}, false);

	ctx.canvas.addEventListener('mousedown', function (mouseEvent)
	{
		footer.classList.add('noSelect'); // Prevents anything from being selected while mouse moves

		var project = getProjectByCoordinates(mouse.x, mouse.y);
		var dayNo = getDay(mouse.x);

		if (project)
		{ // If we didn't click on a project; don't do anything.
			var mouseLoad = project.mouseLoad(dayNo, mouse.y);

			clicked = {
				'project': project,
				'current': dayNo, // In the case that the user doesn't move mouse after clicking
				'previous': dayNo, // The Place we were before is here, since no before.
				'load': project.load(dayNo) > 15 ? Math.min(Math.ceil(mouseLoad / 15) * 15, project.load(dayNo)) : project.load(dayNo), // the current 15 minute section of project (and below)
				'shift': mouseEvent.shiftKey,
				'ctrl': mouseEvent.ctrlKey,
			};

			selectedProject = {
				'project': project,
				'dayClicked': dayNo,
				'load': mouseLoad - mouseLoad % 15, // Makes mouseLoad in 15 min divisible chunks
				'ctrl': mouseEvent.ctrlKey
			};

			addSelectedInfo(project);

			//			setTimeout(draw, 800); // setTimeout prevents clicked from being shown if we aren't actually dragging, just selecting.
			draw();
		}
		else if (selectedProject)
		{ // Clear selected project if clicking whitespace.
			hideSelectedInfo();
			selectedProject = null; // No need to do this if clicking on a different project, b/c we will simply rewrite the existing selectedProject.
			draw();
		}
		else
		{
			clickedStart = dayNo;
		}

	}, false);

	ctx.canvas.addEventListener('mouseup', function ()
	{
		footer.classList.remove('noSelect');

		if (clicked)
		{
			saveWork();
			clicked = null;
			draw();
		}

		if (clickedStart)
		{
			clickedStart = null;
		}
	}, false);

	document.addEventListener('mousemove', function (event)
	{
		mouse.x = event.clientX || event.pageX;
		mouse.y = event.clientY || event.pageY;

		var project = getProjectByCoordinates(mouse.x, mouse.y);
		var dayNo = getDay(mouse.x);

		if (moused && (moused.project != project || moused.day != dayNo))
		{ // If we changed days or projects, we need to erase the old lines.
			if (!selectedProject)
			{
				hideSelectedInfo();
			}
			moused = null;
			draw();
		}

		if (project && !selectedProject)
		{
			project.drawLadder(dayNo);

			moused = {
				'project': project,
				'day': dayNo
			};
		}

		if (clickedStart)
		{
			updateFirstDay(firstDay + clickedStart - dayNo);
		}

		if (!clicked)
		{ // Nothing being moved, we are done.
			return;
		}

		clicked.ctrl = event.ctrlKey; // Allows people to ctrl & shift states while clicking.
		clicked.shift = event.shiftKey;

		clicked.project.updateDayLoad(dayNo); // Checks if stuff needs to be changed, changes it, and draws.
	}, false);

	onResizeWindow(); // FIXME: Cannot call onResize(); b/c window.onresize seems to interfere.
}

function draw()
{
	ctx.font = fontStack;
	drawDays();
	drawScroll();
}

function drawBorder(dayNo)
{
	var x = leftBorder(dayNo);
	var oldColor = ctx.fillStyle;
	if (dayNo == now)
	{
		ctx.fillStyle = 'red';
	}
	if (dayNo == firstDay + daysPerPage)
	{
		--x; // Drawing on canvas cannot be done at canvas width.
	}
	ctx.fillRect(x, 0, borderWidth, screenHeight);
	ctx.fillStyle = oldColor;
}

function drawProjects(dayNo)
{
	var foundProjects = getProjects(dayNo);
	if (clicked && clicked.project && !foundProjects.contains(clicked.project))
	{
		foundProjects.push(clicked.project);
	}
	var offsetTop = dayTitleHeight;

	for (var i = 0; i < foundProjects.length; i++)
	{
		offsetTop = foundProjects[i].draw(dayNo, offsetTop); // Returns the new offsetTop
	}
}

function drawDays()
{
	var lastDay = firstDay + daysPerPage;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas for redrawing

	for (var dayNo = firstDay; dayNo < lastDay; dayNo++)
	{
		var oldColor;
		oldColor = ctx.fillStyle;
		if (dayNo < now)
		{
			ctx.fillStyle = 'lightgray';
			ctx.fillRect(dayStart(dayNo), 0, dayWidth(), ctx.canvas.height);
		}

		if (clicked && clicked.project.start() <= dayNo && dayNo <= clicked.project.deadline)
		{
			ctx.fillStyle = 'rgba(0, 153, 74, 0.2)';
			ctx.fillRect(dayStart(dayNo), 0, dayWidth(), ctx.canvas.height);
		}
		ctx.fillStyle = oldColor;

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText((debug ? dayNo + ' ' : '') + dateText(dayNo, true), dayStart(dayNo) + dayWidth() / 2, dayTitleHeight / 2 + borderWidth, dayWidth());

		drawProjects(dayNo);
		drawBorder(dayNo);
	}

	// Draw lines across
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, screenWidth, borderWidth); // Scrollbar seperator
	ctx.fillRect(0, dayTitleHeight, leftBorder(lastDay), borderWidth); // Header seperator
	ctx.fillRect(0, daySize * workUnitHeight + dayTitleHeight, leftBorder(lastDay), borderWidth); // daySize line
	ctx.fillRect(0, ctx.canvas.height - 1, leftBorder(lastDay), borderWidth); // Footer seperator

	drawBorder(lastDay);
}

function assert(condition, message)
{
	function AssertionFailed(message)
	{
		this.message = message;
	}
	AssertionFailed.prototype = Object.create(Error.prototype);
	AssertionFailed.prototype.name = 'AssertionFailed';

	if (!condition)
	{
		throw new AssertionFailed(message);// 'Assertion Failed: ' + message;
	}
}
/* jshint ignore:end */
