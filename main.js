var selectedProject, clicked, moused, ctx, screenWidth, screenHeight, fullDayWidth, __measuretext_cache__;
var footer, header, undoButton, exportButton, importButton, scrollbar;

var fontStack = 'Consolas, monaco, monospace';

var mouse = {
	x: 0,
	y: 0
};
var dayCount = 365 * 100;

// In Pixels
var dayTitleHeight = 20;
var borderWidth = 1;
var workUnitHeight = 1; // 1 work units == 1 min of height
var minimumWork = 20;

var daySize = 8 * 60; // In minutes
var calendarFormat = 'YYYY/MM/DD';
var calendarStart = '2014/08/01';
var now = 3;
var firstDay = now;
var daysPerPage = 11;

var dateline = {
	monthDots: 6,
	monthFormat: 'MMM',
	weekDots: 2,
	weekFormat: '[w]w',
	dayDots: 3,
	dayFormat: 'ddd',
	scaleCanvasWidth: 1,
	dots: [],
	get dotSize()
	{
		return Math.floor(headerCtx.canvas.clientHeight / 4);
	},
	get dotY()
	{
		return dateline.dotSize + borderWidth;
	},
	get interval()
	{
		return (screenWidth * dateline.scaleCanvasWidth) / dateline.sections;
	},
	get startPoint()
	{
		return (screenWidth - dateline.interval * dateline.sections) / 2;
	}
};

dateline.sections = (dateline.monthDots + dateline.weekDots + dateline.dayDots) * 2;
dateline.midPoint = Math.floor(dateline.sections / 2);

var debug = false;

document.addEventListener('DOMContentLoaded', init, false);

function init()
{
	footer = document.querySelector('footer');
	headerCtx = document.getElementById('header-canvas').getContext('2d');
	ctx = document.getElementById('main-canvas').getContext('2d');

	loadWork();
	displayVersion();

	if (debug)
	{
		updateDaysPerPage(daysPerPage);
		updateFirstDay(now);
	}
	else
	{
		updateDaysPerPage(daysPerPage);
		updateFirstDay(fromMoment(moment()));
	}

	addEventListeners();

	clearSelectedInfo(); // Hides and clears selected info.

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

		if (project)
		{ // If we didn't click on a project; don't do anything.
			var dayNo = getDay(mouse.x);
			var mouseLoad = project.mouseLoad(dayNo, mouse.y);

			clicked = {
				'project': project,
				'current': dayNo, // In the case that the user doesn't move mouse after clicking
				'previous': dayNo, // The Place we were before is here, since no before.
				'load': Math.ceil(mouseLoad / 15) * 15, // the current 15 minute section of project (and below)
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
			clearSelectedInfo();
			selectedProject = null; // No need to do this if clicking on a different project, b/c we will simply rewrite the existing selectedProject.
			draw();
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
	}, false);

	document.addEventListener('mousemove', function (e)
	{
		mouse.x = e.clientX || e.pageX;
		mouse.y = e.clientY || e.pageY;

		var project = getProjectByCoordinates(mouse.x, mouse.y);
		var dayNo = getDay(mouse.x);

		if (moused && (moused.project != project || moused.day != dayNo))
		{ // If we changed days or projects, we need to erase the old lines.
			if (!selectedProject)
			{
				clearSelectedInfo();
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

		if (!clicked)
		{ // Nothing being moved, we are done.
			return;
		}

		clicked.ctrl = e.ctrlKey; // Allows people to ctrl & shift states while clicking.
		clicked.shift = e.shiftKey;

		clicked.project.updateDayLoad(dayNo); // Checks if stuff needs to be changed, changes it, and draws.
	}, false);

	onResizeWindow(); // FIXME: Cannot call onResize(); b/c window.onresize seems to interfere.
}

function draw()
{
	drawDays();
	drawScroll();
}

function drawScroll()
{
	headerCtx.clearRect(0, 0, headerCtx.canvas.clientWidth, headerCtx.canvas.clientHeight);

	headerCtx.fillStyle = 'black';
	var datelineCenterX = dateline.startPoint + dateline.interval * dateline.midPoint;
	headerCtx.fillRect(0, dateline.dotY, datelineCenterX - dateline.interval / 2, borderWidth);
	headerCtx.fillRect(datelineCenterX + dateline.interval / 2, dateline.dotY, headerCtx.canvas.clientWidth - datelineCenterX, borderWidth);

	for (var dotNumber = 0; dotNumber < dateline.midPoint; dotNumber++) // To the left
	{
		calculatePoint(dotNumber, -1);
		calculatePoint(dotNumber, +1);
	}

	var x = dateline.startPoint + dateline.interval / 2;

	for (dotNumber = 0; dotNumber < dateline.midPoint; dotNumber++)
	{
		dateline.dots[dotNumber].x = x;

		drawDot(dotNumber, -1);
		drawDot(dotNumber, +1);

		x += dateline.interval;
	}
}

function drawDot(dotNumber, side)
{
	var x = dateline.dots[dotNumber].x;

	if (side > 0)
	{
		x = headerCtx.canvas.width - x;
	}

	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;
	dateline.dots[sidedDotNumber].areas = [x - dateline.interval / 2, x + dateline.interval / 2];
	dateline.dots[sidedDotNumber].x = x;

	headerCtx.beginPath();
	headerCtx.fillStyle = dateline.dots[sidedDotNumber].color;
	headerCtx.arc(x, dateline.dotY, Math.ceil(dateline.dotSize * dateline.dots[sidedDotNumber].modifier), 0, Math.PI * 2);
	headerCtx.closePath();
	headerCtx.fill();

	headerCtx.fillStyle = 'black';
	headerCtx.textAlign = 'center';
	headerCtx.textBaseline = 'middle';
	headerCtx.fillText(dateline.dots[sidedDotNumber].text, x, dateline.dotY + dateline.dotSize * 2);
}

function getCurrentDay()
{
	return firstDay + Math.floor(daysPerPage / 2);
}

function calculatePoint(dotNumber, side)
{
	var dotModifier = 1;
	var text = '';
	var dotType = '';
	var differenceInDays = 0;
	var color;
	var dayDelta;

	var currentDay = getCurrentDay();

	if (dotNumber < dateline.monthDots)
	{
		color = 'blue';

		dayDelta = side * (dateline.monthDots - dotNumber);
		currentMoment = toMoment(currentDay).add('month', dayDelta);
		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');

		text = currentMoment.format(dateline.monthFormat);
		dotType = 'month';
	}
	else if (dotNumber < dateline.monthDots + dateline.weekDots)
	{
		color = 'red';
		dotModifier = 0.75;

		dotType = 'week';

		dayDelta = side * (dateline.monthDots + dateline.weekDots - dotNumber);
		currentMoment = toMoment(currentDay).add('week', dayDelta);

		text = currentMoment.format(dateline.weekFormat);

		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');
	}
	else if (dotNumber < dateline.monthDots + dateline.weekDots + dateline.dayDots)
	{
		color = '#00b100';
		dotModifier = 0.5;

		dotType = 'day';

		dayDelta = side * (dateline.monthDots + dateline.weekDots + dateline.dayDots - dotNumber);
		currentMoment = toMoment(currentDay).add('day', dayDelta);

		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');
		text = currentMoment.format(dateline.dayFormat);
	}

	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;
	dateline.dots[sidedDotNumber] = {
		text: text,
		areas: [null, null], //[x - dateline.interval / 2, x + dateline.interval / 2],
		x: null,
		type: dotType,
		modifier: dotModifier,
		dayDifference: differenceInDays,
		color: color
	};
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

		ctx.font = '11pt bold ' + fontStack;
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

function assert(condition)
{
	if (!condition)
	{
		throw 'Assertion Failed!';
	}
}

function everythingIsOkay()
{
	for (var i = projects.length - 1; i >= 0; i--)
	{
		if (!projects[i].test())
		{
			return false;
		}
	}

	assert(firstDay >= 0);

	return true;
}
