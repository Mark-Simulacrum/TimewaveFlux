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

function dateText(dayNo, fullDate)
{
	var date = toMoment(dayNo).date() + '';
	var yearDate = '\n' + toMoment(dayNo).format('YYYY/MM/DD'); // For now, default to day 0 being now (as in, today in real time)
	if (fullDate)
	{
		return yearDate;
	}
	else
	{
		return date;
	}
}

function toMoment(dayNo)
{
	return moment(calendarStart, calendarFormat).add('days', dayNo).startOf('day');
}

function fromMoment(moment)
{
	return moment.startOf('day').diff(toMoment(0), 'days'); // startOf('day') is necessary, otherwise halfdays and other weird rounds happen
}

// Canvas helpers

function multilineText(text, x, y, maxWidth, maxHeight, color)
{
	x += maxWidth / 2; // Center text print start point
	var textArray = text.split('\n');
	var height = MeasureText(textArray[0], false, 'Arial', 12)[1]; // Get height of text.

	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.font = 'Arial 12pt';

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
	for (var i = foundProjects.length - 1; i >= 0; i--)
	{
		var project = foundProjects[i];
		var relativeDayNo = project.relativeDayNo(dayNo);

		if (project.y[relativeDayNo] < y && y < project.maxY(dayNo))
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

function saveableProjects()
{
	var array = [];
	for (var i = 0; i < projects.length; i++)
	{
		var project = projects[i];
		array.push(
		{
			name: project.name,
			customer_name: project.customer_name,
			deadline: project.deadline,
			size: project.size,
			color: project.color,
			dayLoad: project.dayLoad,
			workDone: project.workDone
		});
	}
	return array;
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

	if (string.contains("h"))
	{
		hours += Number(string.match(/(\d+)h/)[1]);
	}

	if (string.contains("m"))
	{
		var newMinutes = Number(string.match(/(\d+)m/)[1]);
		minutes += newMinutes;
	}
	else if (!string.contains("h"))
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

function workToTime(workUnits)
{
	var isNegative = workUnits < 0 ? '-' : '';
	var minutes = workUnits % 60;
	var hours = (workUnits - minutes) / 60;

	minutes = minutes > 0 ? minutes + 'min' : ''; // Convert number to string
	hours = hours > 0 ? hours + 'h' : ''; // Convert number to string
	if (!hours && !minutes) return '0';


	return isNegative + hours + minutes;
}

function updateDaysPerPage(newValue)
{
	if (newValue > 0)
	{
		if (typeof newValue != 'number') newValue = Number(newValue); // Make sure that newValue is a Number.
		daysPerPage = newValue;
		document.getElementById('day_amount').value = daysPerPage;
		fullDayWidth = screenWidth / daysPerPage;
		//scrollbar.max = dayCount - daysPerPage;
		draw();
	}
}

function updateFirstDay(newValue)
{
	if (typeof newValue != 'number') newValue = Number(newValue);

	var oldValue = firstDay;

	if (newValue < 0)
	{
		notification('Setting firstDay to the start of time... attempted setting of date before the start of time.');
		firstDay = 0;
	}
	else if (newValue > dayCount)
	{
		notification('Setting firstDay to the end of time... attempted setting of date after the end of time.');
		firstDay = dayCount;
	}
	else
	{ // Everything is OK
		firstDay = newValue;
	}

	if (firstDay != oldValue)
	{
		notification('First day has been moved ' + toMoment(firstDay).from(toMoment(oldValue), true) + (toMoment(firstDay).isAfter(toMoment(oldValue)) ? " in the future." : " into the past."));
	}

	document.getElementById('date').value = toMoment(firstDay).format(calendarFormat);
	draw();
}

function notification(message)
{
	var notificationElement = footer.querySelector('.notification');
	if (notificationElement.innerHTML.split("<br>").length > 100)
	{
		notificationElement.innerHTML = ''; // If more than 100 notifications, clear. // XXX: change to remove earliest notification
	}
	notificationElement.innerHTML += message + '<br>';
	notificationElement.scrollTop = notificationElement.scrollHeight; // Scroll to bottom
}

function addEventListeners()
{
	var projectInput = document.querySelector('footer .project #workInput');

	var buttonDone = document.getElementById('done');
	var dateInput = document.getElementById('date');

	// If in project section, no need to check for selectedProject as we cannot click anything there w/o selecting a project.
	buttonDone.addEventListener('click', function ()
	{
		if (projectInput.value === 0 || !projectInput.value) return;

		var inputWorkUnits = timeToWork(projectInput.value);

		if (inputWorkUnits < 0 && -inputWorkUnits > selectedProject.project.workDone)
		{
			notification('Input of ' + projectInput.value + ' is subtracting too much from the current amount of finished work. Please change.');
			return;
		}

		if (inputWorkUnits > selectedProject.project.size())
		{
			var answer = confirm('Do you wish to mark ' + selectedProject.project.name + ' completely done?');
			if (answer)
			{
				inputWorkUnits = selectedProject.project.size();
			}
			else
			{
				return;
			}
		}

		selectedProject.project.workDone += inputWorkUnits;
		projectInput.value = '';
		addSelectedInfo(selectedProject.project);

		saveWork();
		draw();
	}, false);

	document.getElementById('spread').addEventListener('click', function ()
	{
		selectedProject.project.spread();
	}, false);

	document.getElementById('change-work').addEventListener('click', function ()
	{
		if (projectInput.value === 0 || !projectInput.value) return;

		var inputWorkUnits = timeToWork(projectInput.value);

		selectedProject.project.changeWork(inputWorkUnits);
	}, false);

	document.getElementById('project_center').addEventListener('click', function (e)
	{
		var project = selectedProject.project;
		var middleDay = firstDay + daysPerPage / 2;
		var middleProject = project.firstWork() + project.dayLoadLength() / 2;

		updateFirstDay(firstDay + Math.floor(middleProject - middleDay));
	}, false);
	document.getElementById('project_start').addEventListener('click', function (e)
	{
		updateFirstDay(selectedProject.project.start());
	}, false);
	document.getElementById('project_deadline').addEventListener('click', function (e)
	{
		updateFirstDay(selectedProject.project.end() - daysPerPage);
	}, false);

	document.getElementById('change_start-deadline').addEventListener('click', function ()
	{
		var project = selectedProject.project;
		var newStart = fromMoment(moment(document.getElementById('start').value, calendarFormat));
		var newDeadline = fromMoment(moment(document.getElementById('deadline').value, calendarFormat));

		project.changeStart(newStart);
		project.changeDeadline(newDeadline);

		addSelectedInfo(project);
	}, false);

	dateInput.addEventListener('change', function ()
	{
		updateFirstDay(fromMoment(moment(dateInput.value, calendarFormat)));
	}, false);

	/*scrollbar.addEventListener('input', function () {
		updateFirstDay(scrollbar.value);
	}, false);*/

	document.getElementById('date_minus_31').addEventListener('click', function ()
	{
		updateFirstDay(firstDay - 31);
	}, false);
	document.getElementById('date_minus_7').addEventListener('click', function ()
	{
		updateFirstDay(firstDay - 7);
	}, false);
	document.getElementById('date_minus_1').addEventListener('click', function ()
	{
		updateFirstDay(firstDay - 1);
	}, false);
	document.getElementById('date_add_1').addEventListener('click', function ()
	{
		updateFirstDay(firstDay + 1);
	}, false);
	document.getElementById('date_add_7').addEventListener('click', function ()
	{
		updateFirstDay(firstDay + 7);
	}, false);
	document.getElementById('date_add_31').addEventListener('click', function ()
	{
		updateFirstDay(firstDay + 31);
	}, false);

	document.getElementById('day_amount').addEventListener('change', function (e)
	{
		// var newDaysPerPage = Number(e.target.value);
		// var futureMiddle = newDaysPerPage/2; // futureMiddle w/o adjustments
		// var pastMiddle = daysPerPage/2;
		// var adjustment = 0;
		// var delta = Math.ceil((daysPerPage - newDaysPerPage)/2);

		// if (newDaysPerPage % 2 == 0) { // From a,b,c to b,c (odd to even)
		// 	adjustment = futureMiddle > pastMiddle ? 0 : +1;
		// } else { // From b,c to a,b,c (even to odd)
		// 	adjustment = futureMiddle > pastMiddle ? -1 :  0;
		// }

		// console.log(firstDay, newDaysPerPage, pastMiddle, futureMiddle, delta, adjustment);

		// updateDaysPerPage(newDaysPerPage);
		// updateFirstDay(firstDay + delta + adjustment);

		// var futureDaysPerPage = Number(e.target.value);
		// var pastMiddle = firstDay + daysPerPage/2;
		// var futureMiddle = firstDay + futureDaysPerPage/2;

		// var futureFirstDay = futureMiddle - daysPerPage/2;

		// updateDaysPerPage(futureDaysPerPage);

		updateDaysPerPage(e.target.value);
	}, false);

	document.getElementById('today').addEventListener('click', function ()
	{
		updateFirstDay(fromMoment(moment()));
	}, false);

	document.getElementById('undo').addEventListener('click', function ()
	{
		if (localStorage.currentVersion > 0)
		{
			--localStorage.currentVersion;
			displayVersion();
			loadWork();
			draw();
		}
		else
		{
			notification('Cannot undo from version 0.');
		}
	}, false);

	document.getElementById('redo').addEventListener('click', function ()
	{
		if (localStorage.currentVersion - 1 < JSON.parse(localStorage.savedProjects).length)
		{ // At least 2 less than the amount of history
			++localStorage.currentVersion;
			displayVersion();
			loadWork();
			draw();
		}
		else
		{
			notification('Cannot go past the last saved work.');
		}
	}, false);

	document.getElementById('export').addEventListener('click', function ()
	{
		var blob = new Blob([JSON.stringify(saveableProjects(), undefined, 4)],
		{
			type: 'text/plain;charset=utf-8'
		});
		saveAs(blob, "ProjectConfig.exported.js");
	}, false);

	document.getElementById('import').addEventListener('click', function ()
	{
		document.getElementById('import_input').click();
	}, false);

	document.getElementById('import_input').addEventListener('change', function (e)
	{
		var file = e.target.files[0];
		if (file)
		{
			var reader = new FileReader();

			reader.onloadstart = function (e)
			{
				notification('Starting file upload of ' + file.name);
			};

			reader.onload = function (e)
			{
				notification('Finished file upload of ' + file.name);
				var fileContent = reader.result;
				loadSavedFile(fileContent);
				document.getElementById('import_input').value = ''; // Clear the file input b/c browser otherwise no longer registers change event (unless file name changes)
			};

			reader.readAsText(file); // Actually read the file
		}
	}, false);
}

function onResizeWindow()
{
	screenWidth = window.innerWidth;
	screenHeight = document.querySelector('html').clientHeight;

	ctx.canvas.width = screenWidth;
	headerCtx.canvas.width = screenWidth;
	//headerCtx.canvas.style.margin =  "0 auto";
	ctx.canvas.height = screenHeight - footer.clientHeight - headerCtx.canvas.clientHeight;

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
	if (saved_projects === undefined || saved_projects === null)
	{ // We shouldn't try to load projects that are not existent
		return projects; // Return current projects, which (hopefully?) are not null.
	}

	var new_projects = [];
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
		notification('Saving current work as first work saved.');
		localStorage.savedProjects = JSON.stringify([saveableProjects()]); // Set this to empty array, below logic will handle
	}

	if (!localStorage.currentVersion)
	{
		notification('No current version, defaulting to last element.');
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
	if (debug) return;
	setupLocalStorage();

	var currentVersion = Number(localStorage.currentVersion); // localStorage contains string, we should convert to number
	var savedProjects = JSON.parse(localStorage.savedProjects)[currentVersion];

	projects = loadProjects(savedProjects);
	draw(); // Once we've loaded work, draw.
}

function tooltip(x, y, text)
{
	var element = document.querySelector('#tooltip');
	element.innerHTML = text;
	element.style.left = x + 'px';
	element.style.top = y + 'px';
	element.style.display = 'inline-block';
}

function clearTooltip()
{
	var element = document.querySelector('#tooltip');
	element.style.display = 'none';
}

// Third-party functions

/**
 * Work attributed to: http://www.rgraph.net/blog/2013/january/measuring-text-height-with-html5-canvas.html; Richard Heyes
 * Measures text by creating a DIV in the document and adding the relevant text to it.
 * Then checking the .offsetWidth and .offsetHeight. Because adding elements to the DOM is not particularly
 * efficient in animations (particularly) it caches the measured text width/height.
 *
 * @param  string text   The text to measure
 * @param  bool   bold   Whether the text is bold or not
 * @param  string font   The font to use
 * @param  size   number The size of the text (in pts)
 * @return array         A two element array of the width and height of the text
 */
function MeasureText(text, bold, font, size)
{
	// This global variable is used to cache repeated calls with the same arguments
	var str = text + ':' + bold + ':' + font + ':' + size;
	if (typeof (__measuretext_cache__) == 'object' && __measuretext_cache__[str])
	{
		return __measuretext_cache__[str];
	}

	var div = document.createElement('DIV');
	div.innerHTML = text;
	div.style.position = 'absolute';
	div.style.top = '-100px';
	div.style.left = '-100px';
	div.style.fontFamily = font;
	div.style.fontWeight = bold ? 'bold' : 'normal';
	div.style.fontSize = size + 'pt';
	document.body.appendChild(div);

	var stringSize = [div.offsetWidth, div.offsetHeight];

	document.body.removeChild(div);

	// Add the sizes to the cache as adding DOM elements is costly and can cause slow downs
	if (typeof (__measuretext_cache__) != 'object')
	{
		__measuretext_cache__ = [];
	}
	__measuretext_cache__[str] = stringSize;

	return stringSize;
}

/** // Chris Coyier, CSS TRICKS, http://css-tricks.com/snippets/javascript/javascript-array-contains/
 * Array.prototype.[method name] allows you to define/overwrite an objects method
 * needle is the item you are searching for
 * this is a special variable that refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */
Array.prototype.contains = function (needle)
{
	// for (var i in this) {
	//     if (this[i] === needle) return true;
	// }
	// return false;

	return this.indexOf(needle) >= 0;
};

// Credit: MDN @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains
if (!String.prototype.contains)
{
	String.prototype.contains = function ()
	{
		return String.prototype.indexOf.apply(this, arguments) !== -1;
	};
}

Array.prototype.trimZeros = function ()
{
	var array = this.slice(0); // Don't modify this, return new array.
	while (array.length > 0 && array[0] === 0)
	{
		array.shift();
	}
	while (array.length > 0 && array[array.length - 1] === 0)
	{
		array.pop();
	}
	return array;
};
