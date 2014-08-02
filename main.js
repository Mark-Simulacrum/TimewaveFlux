var selectedProject, clicked, moused, ctx, screenWidth, screenHeight, fullDayWidth, __measuretext_cache__;
var footer, header, undoButton, exportButton, importButton, scrollbar;

var fontStack = 'Consolas, monaco, monospace';

var mouse = {
	x: 0,
	y: 0
};
var dayCount = 365 * 100;

// In Pixels
var headerSize = 20;
var borderWidth = 1;
var workUnitHeight = 1; // 1 work units == 1 min of height
var minimumWork = 20;

var daySize = 8 * 60; // In minutes
var calendarStart = '2014/08/01';
var calendarFormat = 'YYYY/MM/DD';
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
	areas: [],
	dotX: [],
	text: [],
	dayDifference: [],
	dotType: [],
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

var debug = true;

document.addEventListener('DOMContentLoaded', init, false);

function getDatelineDot(x)
{
	for (var i = 0; i < dateline.areas.length; i++)
	{
		if (dateline.areas[i][0] < x && x < dateline.areas[i][1])
		{
			var distanceFromDot = 0;

			if (x < dateline.dotX[i] - dateline.dotSize)
			{
				distanceFromDot = dateline.dotX[i] - dateline.dotSize - x;
			}
			else if (x > dateline.dotX[i] + dateline.dotSize)
			{
				distanceFromDot = dateline.dotX[i] + dateline.dotSize - x;
			}

			return {
				dotNumber: i,
				onDot: distanceFromDot === 0,
				distanceFromDot: Math.floor(distanceFromDot)
			};
		}
	}
	return null;
}

function getDatelineDayDifference(x)
{
	var clickedData = getDatelineDot(x);
	if (clickedData)
	{
		var dotDayDifference = dateline.dayDifference[clickedData.dotNumber];
		if (clickedData.onDot || dateline.dotType[clickedData.dotNumber] == 'day')
		{
			return dotDayDifference;
		}
		else
		{
			if (dateline.dotType[clickedData.dotNumber] == 'week')
			{
				return dotDayDifference + Math.round(clickedData.distanceFromDot * 10 / dateline.interval * -1);
			}
			else if (dateline.dotType[clickedData.dotNumber] == 'month')
			{
				return dotDayDifference + Math.round(clickedData.distanceFromDot * 10 / dateline.interval * -1);
			}
		}
	}

	return 0; // Return 0 by default
}

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

			// setTimeout(draw, 800); // setTimeout prevents clicked from being shown if we aren't actually dragging, just selecting.
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
	headerCtx.fillRect(0, dateline.dotY, headerCtx.canvas.width, borderWidth);

	for (var dotNumber = 0; dotNumber < dateline.midPoint; dotNumber++) // To the left
	{
		drawPoint(dotNumber, -1);
		drawPoint(dotNumber, +1);
	}
}

function getCurrentDay()
{
	return firstDay + Math.floor(daysPerPage / 2);
}

function drawPoint(dotNumber, side)
{
	var x = dotNumber * dateline.interval + dateline.startPoint + dateline.interval / 2;
	var dotSizeModifier = 1;
	var text = '';
	var type = '';
	var differenceInDays = 0;
	var dayDelta;

	var currentDay = getCurrentDay();

	if (side > 0)
	{
		x = headerCtx.canvas.width - x;
	}

	if (dotNumber == dateline.midPoint - 1 && side < 0)
	{
		headerCtx.clearRect(x, dateline.dotY, dateline.interval, borderWidth);
	}

	if (dotNumber < dateline.monthDots)
	{
		headerCtx.fillStyle = 'blue';

		dayDelta = side * (dateline.monthDots - dotNumber);
		currentMoment = toMoment(currentDay).add('month', dayDelta);
		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');

		text = currentMoment.format(dateline.monthFormat);
		type = 'month';

	}
	else if (dotNumber < dateline.monthDots + dateline.weekDots)
	{
		headerCtx.fillStyle = 'red';
		dotSizeModifier = 0.7;

		type = 'week';

		dayDelta = side * (dateline.monthDots + dateline.weekDots - dotNumber);
		currentMoment = toMoment(currentDay).add('week', dayDelta);

		text = currentMoment.format(dateline.weekFormat);

		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');

	}
	else if (dotNumber < dateline.monthDots + dateline.weekDots + dateline.dayDots)
	{
		headerCtx.fillStyle = 'green';
		dotSizeModifier = 0.5;

		type = 'day';

		dayDelta = side * (dateline.monthDots + dateline.weekDots + dateline.dayDots - dotNumber);
		currentMoment = toMoment(currentDay).add('day', dayDelta);

		differenceInDays = currentMoment.startOf('day').diff(toMoment(currentDay), 'days');
		text = currentMoment.format(dateline.dayFormat);
	}

	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;
	dateline.text[sidedDotNumber] = text;
	dateline.areas[sidedDotNumber] = [x - dateline.interval / 2, x + dateline.interval / 2];
	dateline.dotX[sidedDotNumber] = x;
	dateline.dotType[sidedDotNumber] = type;
	dateline.dayDifference[sidedDotNumber] = differenceInDays;

	headerCtx.beginPath();
	headerCtx.arc(x, dateline.dotY, Math.ceil(dateline.dotSize * dotSizeModifier), 0, Math.PI * 2);
	headerCtx.closePath();
	headerCtx.fill();

	headerCtx.fillStyle = 'black';
	headerCtx.textAlign = 'center';
	headerCtx.textBaseline = 'middle';
	headerCtx.fillText(text, x, dateline.dotY + dateline.dotSize * 2);
}

function drawBorder(dayNo)
{
	var x = leftBorder(dayNo);
	var oldColor = ctx.fillStyle;
	if (dayNo == now)
	{
		ctx.fillStyle = 'red';
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
	var offsetTop = headerSize;

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
		if (dayNo < now)
		{
			oldColor = ctx.fillStyle;
			ctx.fillStyle = 'lightgray';
			ctx.fillRect(dayStart(dayNo), 0, dayWidth(), ctx.canvas.height);
			ctx.fillStyle = oldColor;
		}

		if (clicked && clicked.project.start() <= dayNo && dayNo <= clicked.project.deadline)
		{
			oldColor = ctx.fillStyle;
			ctx.fillStyle = 'rgba(0, 153, 74, 0.2)';
			ctx.fillRect(dayStart(dayNo), 0, dayWidth(), ctx.canvas.height);
			ctx.fillStyle = oldColor;
		}

		ctx.textAlign = 'center';
		ctx.font = '11pt bold ' + fontStack;
		// multilineText(dateText(dayNo, true), dayStart(dayNo), 0, dayWidth(), headerSize, 'black');
		ctx.textBaseline = 'top';
		ctx.fillText((debug ? dayNo + ' ' : '') + dateText(dayNo, true), dayStart(dayNo) + dayWidth() / 2, 0, dayWidth());

		drawProjects(dayNo);
		drawBorder(dayNo);
	}

	// Draw lines across
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, screenWidth, borderWidth); // Scrollbar seperator
	ctx.fillRect(0, headerSize, leftBorder(lastDay), borderWidth); // Header seperator
	ctx.fillRect(0, daySize * workUnitHeight + headerSize, leftBorder(lastDay), borderWidth); // daySize line
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
