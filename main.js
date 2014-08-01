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

var debug = true;

document.addEventListener('DOMContentLoaded', init, false);

function init()
{
	footer = document.querySelector('footer');
	//	scrollbar = document.getElementById('firstDayScrollbar');
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

	// headerCtx.canvas.addEventListener('mousemove', function (mouseEvent) {
	// 	// headerCtx.canvas.setAttribute('title', mouseEvent.x);
	// 	tooltip(screenWidth/2, scrollbarHeight, mouseEvent.x);
	// }, false);

	// headerCtx.canvas.addEventListener('mouseleave', function () {
	// 	clearTooltip();
	// }, false);

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
			}

			selectedProject = {
				'project': project,
				'dayClicked': dayNo,
				'load': mouseLoad - mouseLoad % 15, // Makes mouseLoad in 15 min divisible chunks
				'ctrl': mouseEvent.ctrlKey
			}

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
			if (!selectedProject) clearSelectedInfo();
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

	// Dots per side
	var monthDots = 6;
	var weekDots = 2;
	var dayDots = 3;

	var sections = (monthDots + weekDots + dayDots) * 2;

	var sizeModifier = 1;
	var interval = (screenWidth * sizeModifier) / sections;
	var startPoint = (screenWidth - interval * sections) / 2;
	var dotSize = headerCtx.canvas.clientHeight / 2 / 3;

	headerCtx.clearRect(0, 0, headerCtx.canvas.clientWidth, headerCtx.canvas.clientHeight);

	var midPoint = Math.floor(sections / 2);

	for (var dotNumber = 0; dotNumber < midPoint; dotNumber++) // To the left
	{
		var x = dotNumber * interval + startPoint + interval / 2;
		var dotSizeModifier = 1;
		var text = "rr";

		if (dotNumber < monthDots)
		{
			headerCtx.fillStyle = 'blue';
			text = toMoment(firstDay).clone().subtract('month', monthDots - dotNumber).format("MMM");
		}
		else if (dotNumber < monthDots + weekDots)
		{
			headerCtx.fillStyle = 'red';
			dotSizeModifier = 0.7;
		}
		else if (dotNumber < monthDots + weekDots + dayDots)
		{
			headerCtx.fillStyle = 'green';
			dotSizeModifier = 0.5;
		}
		else
		{
			headerCtx.fillStyle = 'black';
		}

		headerCtx.moveTo(x, headerCtx.canvas.height / 2);
		headerCtx.beginPath();
		headerCtx.arc(x, headerCtx.canvas.height / 2 / 2, Math.ceil(dotSize * dotSizeModifier), 0, Math.PI * 2);
		headerCtx.closePath();
		headerCtx.fill();

		headerCtx.fillStyle = 'black';
		headerCtx.moveTo(x, headerCtx.canvas.height / 2);
		headerCtx.textAlign = 'center';
		headerCtx.textBaseline = 'center';
		headerCtx.fillText(text, x, headerCtx.canvas.height - headerCtx.canvas.height / 3);
	}

	for (dotNumber = sections; dotNumber >= midPoint; dotNumber--) // To the right
	{
		var x = dotNumber * interval + startPoint + interval / 2;
		var dotSizeModifier = 1;
		var text = "rr";

		if (dotNumber >= sections - monthDots)
		{
			headerCtx.fillStyle = 'blue';
			text = toMoment(firstDay).clone().subtract('month', monthDots - dotNumber).format("MMM");
		}
		else if (dotNumber >= sections - monthDots - weekDots)
		{
			headerCtx.fillStyle = 'red';
			dotSizeModifier = 0.7;
		}
		else if (dotNumber >= sections - monthDots - weekDots - dayDots)
		{
			headerCtx.fillStyle = 'green';
			dotSizeModifier = 0.5;
		}
		else
		{
			headerCtx.fillStyle = 'black';
		}

		headerCtx.moveTo(x, headerCtx.canvas.height / 2);
		headerCtx.beginPath();
		headerCtx.arc(x, headerCtx.canvas.height / 2 / 2, Math.ceil(dotSize * dotSizeModifier), 0, Math.PI * 2);
		headerCtx.closePath();
		headerCtx.fill();

		headerCtx.fillStyle = 'black';
		headerCtx.moveTo(x, headerCtx.canvas.height / 2);
		headerCtx.textAlign = 'center';
		headerCtx.textBaseline = 'center';
		headerCtx.fillText(text, x, headerCtx.canvas.height - headerCtx.canvas.height / 3);
	}

	//	for (var i = 0; i < sections; i++) {
	//		var x = i * interval;
	//		var text = "";
	//		
	//		if (i <= inYear || i >= sections - inYear) {
	//			text = "inY";
	//		} else if (i <= inWeek || i >= sections - inWeek) {
	//			text = "inW";
	//			
	//		} else if (i <= inMonth || i >= sections - inMonth) {
	//			text = "inM";
	//		}
	//		
	//		headerCtx.fillStyle = 'black';
	//		headerCtx.moveTo(x, headerCtx.canvas.height / 2);
	//		headerCtx.textAlign = 'center';
	//		headerCtx.textBaseline = 'center';
	//		//monthMoment = firstDayMoment.clone().subtract('month', 6);
	//		headerCtx.fillText(text, x, headerCtx.canvas.height - headerCtx.canvas.height / 3);
	//	}
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
	if (clicked && clicked.project && !foundProjects.contains(clicked.project)) foundProjects.push(clicked.project);
	var offsetTop = headerSize;

	for (var i = 0; i < foundProjects.length; i++)
	{
		offsetTop = foundProjects[i].draw(dayNo, offsetTop); // Returns the new offsetTop
	};
}

function drawDays()
{
	var lastDay = firstDay + daysPerPage;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas for redrawing

	for (var dayNo = firstDay; dayNo < lastDay; dayNo++)
	{
		if (dayNo < now)
		{
			var oldColor = ctx.fillStyle;
			ctx.fillStyle = 'lightgray';
			ctx.fillRect(dayStart(dayNo), 0, dayWidth(), ctx.canvas.height);
			ctx.fillStyle = oldColor;
		}

		if (clicked && clicked.project.start() <= dayNo && dayNo <= clicked.project.deadline)
		{
			var oldColor = ctx.fillStyle;
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
	};

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
	if (!condition) throw 'Assertion Failed!';
}

function everythingIsOkay()
{
	for (var i = projects.length - 1; i >= 0; i--)
	{
		if (!projects[i].test()) return false;
	};

	assert(firstDay >= 0);

	return true;
}