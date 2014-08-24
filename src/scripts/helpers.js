/* jshint ignore:start */
'use strict';
// General Helpers

function dayLoad(dayNo)
{
	var accumulatedLoad = 0;

	for (var i = 0; i < projects; i++)
	{
		var project = projects[i];
		if (project.start() <= dayNo && dayNo < project.end())
		{
			accumulatedLoad += project.load(dayNo - project.start());
		}
	}

	return accumulatedLoad;
}

function leftBorder(dayNo)
{
	return (dayNo - firstDay) * fullDayWidth;
}

function dayStart(dayNo)
{
	return leftBorder(dayNo) + borderWidth;
}

function dayEnd(dayNo)
{
	return dayStart(dayNo) + dayWidth();
}

function dayWidth()
{
	return fullDayWidth - borderWidth;
}

function getDay(offsetLeft)
{
	var day = Math.floor(offsetLeft / fullDayWidth) + firstDay;
	if (day < 0) day = 0;
	return day;
}

/*
 * Returns a moment object
 * @return moment
 */
function fromDate(date)
{
	return moment(date, calendarFormat);
}

// Canvas helpers

function multilineText(text, x, y, maxWidth, maxHeight, color)
{
	x += maxWidth / 2; // Center text print start point
	var textArray = text.split('\n');
	var height = MeasureText(textArray[0], false, 'Arial', 12)[1]; // Get height of text.

	ctx.fillStyle = color;
	ctx.textAlign = 'center';

	for (var i = 0; i < textArray.length; i++)
	{
		if (height * (i + 1) >= maxHeight)
		{
			ctx.fillStyle = 'black';
			return;
		}
		var line = textArray[i];
		ctx.fillText(line, x, y + height * i, maxWidth);
	}

	ctx.fillStyle = 'black';
}

function getProjectByCoordinates(x, y)
{
	var dayNo = getDay(x);
	var foundProjects = getProjects(dayNo);
	for (var i = 0; i < foundProjects.length; i++)
	{
		var project = foundProjects[i];
		var relativeDayNo = project.relativeDayNo(dayNo);

		// Add headerCtx canvas height to fix coordinates.
		if (project.y[relativeDayNo] + headerCtx.canvas.clientHeight < y && y < project.maxY(dayNo) + headerCtx.canvas.clientHeight)
		{
			return project;
		}
	}

	return false;
}

// Project Helpers

function getProjects(dayNo)
{
	var foundProjects = [];

	for (var i = 0; i < projects.length; i++)
	{
		var project = projects[i];
		if (project.start() <= dayNo && dayNo < project.end())
		{ // project.end == project.deadline + 1
			foundProjects.push(project);
		}
	}

	return foundProjects;
}

function workAmount(dayNo)
{
	var dayProjects = getProjects(dayNo);
	var accumulatedWorkAmount = 0;

	for (var i = 0; i < dayProjects.length; i++)
	{
		accumulatedWorkAmount += dayProjects[i].load(dayNo);
	}

	return accumulatedWorkAmount;
}

// Event Helpers

function timeToWork(string)
{
	var hours = 0,
		minutes = 0;

	var negative = string.match(/^-/) ? -1 : 1;

	if (string.contains('h'))
	{
		hours += Number(string.match(/(\d+)h/)[1]);
	}

	if (string.contains('m'))
	{
		var newMinutes = Number(string.match(/(\d+)m/)[1]);
		minutes += newMinutes;
	}
	else if (!string.contains('h'))
	{ // If string does not contain minutes or hours
		if (Number(string) >= 15)
		{
			minutes += Number(string);
		}
		else
		{
			hours += Number(string);
		}
	}

	// \d matches negative signs, we don't really want that since we have our own handling for negatives.
	if (hours < 0) hours = -hours;
	if (minutes < 0) minutes = -minutes;

	return negative * (hours * 60 + minutes);
}

function onResizeWindow()
{
	screenWidth = window.innerWidth;
	screenHeight = document.querySelector('html').clientHeight;

	ctx.canvas.width = screenWidth;
	ctx.canvas.height = screenHeight - footer.clientHeight - headerCtx.canvas.clientHeight;
	headerCtx.canvas.width = screenWidth;

	fullDayWidth = screenWidth / daysPerPage;

	draw();
}

function clearLocalStorage()
{
	delete localStorage.savedProjects;
	delete localStorage.currentVersion;
	delete localStorage.daysPerPage;
	delete localStorage.firstDay;
}

function loadSavedFile(contents)
{
	var parsedContents = JSON.parse(contents);
	projects = loadProjects(parsedContents);
	saveWork(); // Save the loaded data to localStorage, and update version
	draw();
}

function displayVersion(version)
{
	document.getElementById('version').innerHTML = 'v' + localStorage.currentVersion;
}

function loadProjects(saved_projects)
{
	var new_projects = [];
	if (saved_projects === undefined || saved_projects === null || saved_projects.length == 0)
	{ // Load projects from configuration
		var request = new XMLHttpRequest();
		request.open('GET', 'scripts/ProjectConfig.json', false);
		request.send(null);
		saved_projects = JSON.parse(request.responseText);
		projects = [];
		for (var i = 0; i < saved_projects.length; i++)
		{
			projects.push(new Project(saved_projects[i]));
		}

		return projects;
	}

	for (var i = 0; i < saved_projects.length; i++)
	{ // Is needed to preserve Project prototypes.
		new_projects.push(new Project(saved_projects[i]));
	}
	return new_projects;
}

function setupLocalStorage()
{
	if (!localStorage.savedProjects)
	{
		footer.notify('Saving current work as first work saved.');
		localStorage.savedProjects = JSON.stringify([saveableProjects()]); // Set this to empty array, below logic will handle
	}

	if (!localStorage.currentVersion)
	{
		footer.notify('No current version, defaulting to last element.');
		var futureCurrentVersion = JSON.parse(localStorage.savedProjects).length - 1;
		localStorage.currentVersion = futureCurrentVersion >= 0 ? futureCurrentVersion : 0;
	}
}

function saveWork()
{
	if (debug) return;
	setupLocalStorage();

	var currentVersion = Number(localStorage.currentVersion);
	var savedProjects = JSON.parse(localStorage.savedProjects);
	var currentProjects = saveableProjects();

	if (JSON.stringify(savedProjects[currentVersion]) == JSON.stringify(currentProjects)) return; // If we the saved work is the same as the current work, we can exit.
	if (!savedProjects) savedProjects = [];

	savedProjects = savedProjects.slice(0, currentVersion + 1); // Add 1 bc slice removes currVer otherwise. // Removes anything past currentVersion.
	savedProjects.push(currentProjects); // Add current projects to savedProjects

	localStorage.savedProjects = JSON.stringify(savedProjects);
	localStorage.currentVersion = savedProjects.length - 1;

	displayVersion();
}

function loadWork()
{
	setupLocalStorage();

	if (!debug) {
		var currentVersion = Number(localStorage.currentVersion); // localStorage contains string, we should convert to number
		var savedProjects = JSON.parse(localStorage.savedProjects)[currentVersion];
	}
	else
	{
		var savedProjects = null;
	}

	projects = loadProjects(savedProjects);
	draw(); // Once we've loaded work, draw.
}

// Polyfills

if (!Array.prototype.contains)
{
	Array.prototype.contains = function (needle)
	{
		return this.indexOf(needle) !== -1;
	};
}

// Credit: MDN @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains
if (!String.prototype.contains)
{
	String.prototype.contains = function ()
	{
		return String.prototype.indexOf.apply(this, arguments) !== -1;
	};
}

Array.prototype.trim = function (value)
{
	var array = this.slice(0); // Don't modify this, return new array.
	while (array.length > 0 && array[0] === value)
	{
		array.shift();
	}
	while (array.length > 0 && array[array.length - 1] === value)
	{
		array.pop();
	}
	return array;
};
/* jshint ignore:end */
