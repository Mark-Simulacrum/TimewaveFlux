"use strict";

function Project(args)
{
	this.name = args.name;
	this.customer_name = args.customer || 'Unknown Joe';
	this.deadline = fromMoment(moment(args.deadline, calendarFormat));
	this.color = args.color || 'aqua';

	var dayLoadKeys = Object.keys(args.dayLoad);

	dayLoadKeys.sort(function (a, b)
	{
		return fromDate(a).isAfter(fromDate(b));
	});

	this.dayLoad = [];

	for (var keyID = 0; keyID <= this.deadline - fromMoment(fromDate(dayLoadKeys[0])); keyID++)
	{
		var value = args.dayLoad[dayLoadKeys[keyID]];
		if (value)
			this.dayLoad[keyID] = value;
		else
			this.dayLoad[keyID] = 0;
	}

	this.workDone = args.workDone || 0;

	// Initialize variables
	this.y = [];
}

Project.prototype.start = function ()
{
	return this.end() - this.dayLoad.length;
}

Project.prototype.end = function ()
{
	return this.deadline + 1;
}

Project.prototype.firstWork = function ()
{
	for (var worklessDays = 0; worklessDays < this.dayLoad.length; worklessDays++)
	{
		if (this.dayLoad[worklessDays] != 0)
		{
			return this.start() + worklessDays;
		}
	};
	return this.end(); // Shouldn't happen, unless project is workless (dayLoad = [0..0])
}

Project.prototype.lastWork = function ()
{
	return this.firstWork() + this.dayLoadLength() - 1; // Subtract 1 from dayLoadLength to exclude the day of firstWork.
}

Project.prototype.dayLoadLength = function ()
{
	return this.dayLoad.trim(0).length;
}

Project.prototype.relativeDayNo = function (dayNo)
{
	return dayNo - this.start();
}

Project.prototype.load = function (dayNo)
{ // May be called with dayNo that is not in project.dayLoad.
	var relativeLoad = this.dayLoad[this.relativeDayNo(dayNo)];
	return relativeLoad >= 0 ? relativeLoad : 0;
}

Project.prototype.maxY = function (dayNo)
{
	return this.y[this.relativeDayNo(dayNo)] + this.height(dayNo);
}

Project.prototype.height = function (dayNo)
{
	return this.toHeight(this.load(dayNo));
}

Project.prototype.toHeight = function (load)
{
	assert(load >= 0);
	if (load != 0 && load < minimumWork) load = minimumWork; // Sets all project heights to at least minimumWork.
	return (load / 15) * workUnitHeight * 15;
}

Project.prototype.draw = function (dayNo, offsetTop)
{
	assert(offsetTop > 0);
	var offsetLeft = dayStart(dayNo);
	var projectHeight = this.height(dayNo);

	var relativeDayNo = this.relativeDayNo(dayNo);
	var color = selectedProject && this == selectedProject.project ? 'red' : 'black';

	// Don't need to store x because it is dayStart(dayNo).
	this.y[relativeDayNo] = offsetTop;

	if (!projectHeight)
	{
		return offsetTop;
	}

	// Draws rectangle
	ctx.fillStyle = this.color;
	ctx.fillRect(offsetLeft, offsetTop, dayWidth(), projectHeight);

	// Top and bottom project seperators
	ctx.fillStyle = 'black';
	ctx.fillRect(offsetLeft, offsetTop, dayWidth(), borderWidth);
	ctx.fillRect(offsetLeft, offsetTop + projectHeight, dayWidth(), borderWidth);


	if ((selectedProject && selectedProject.project == this) || (moused && moused.project == this))
	{
		this.drawLadder(dayNo);
	}
	this.drawHoursDone(dayNo);

	// Adds text to project
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	if (projectHeight >= minimumWork)
	{
		ctx.fillText(this.name, offsetLeft + dayWidth() / 2, offsetTop, dayWidth());
		if (projectHeight >= minimumWork * 2)
		{
			var workDoneOutOfTotal = workToTime(this.doneLoad(dayNo)) + '/' + workToTime(this.load(dayNo));
			ctx.textBaseline = 'bottom';
			ctx.fillText(workDoneOutOfTotal, offsetLeft + dayWidth() / 2, offsetTop + projectHeight, dayWidth());
		}
	}

	offsetTop += projectHeight;

	return offsetTop;
}

Project.prototype.drawLadder = function (dayNo)
{
	ctx.fillStyle = 'red';
	for (var i = 1; i < Math.ceil(this.load(dayNo) / 15); i++)
	{ // Divide load by 15 to get 15 minute chunks
		var x = dayStart(dayNo);
		var y = this.y[this.relativeDayNo(dayNo)] + i * workUnitHeight * 15;
		var delimeterLength = i % 4 == 0 ? dayWidth() : dayWidth() / 10; // For every hour, draw across whole day.

		ctx.fillRect(x, y, delimeterLength, borderWidth);
	};
	ctx.fillStyle = 'black';
}

Project.prototype.doneLoad = function (dayNo)
{
	assert(dayNo <= this.deadline);

	var workDone = this.workDone;

	for (var i = 0; i < this.dayLoad.length && i < this.relativeDayNo(dayNo); i++)
	{
		workDone -= this.dayLoad[i]; // Remove the amount of work done in that day.
		if (workDone < 0) return 0;
	};

	return Math.min(workDone, this.dayLoad[i]); // Does not allow workDone to exceed amount of work in this day.
}

Project.prototype.loadBefore = function (dayNo, load)
{
	var totalWork = 0;
	for (var i = 0; i < this.dayLoad.length && i < this.relativeDayNo(dayNo); i++)
	{
		totalWork += this.dayLoad[i]; // Add the amount of hours done in this day.
	};

	if (load != undefined) totalWork += load; // Adds load given, but since load can be omitted, can skip this.

	return totalWork;
}

Project.prototype.size = function ()
{
	var size = 0;
	for (var i = this.dayLoad.length - 1; i >= 0; i--)
	{
		size += this.dayLoad[i];
	};
	return size;
}

Project.prototype.drawHoursDone = function (dayNo)
{
	var workDone = this.doneLoad(dayNo);
	if (workDone == 0) return; // Exit if no hours to draw.
	assert(workDone > 0);

	var x = dayStart(dayNo);
	var y = this.y[this.relativeDayNo(dayNo)];
	var crossHeight = this.toHeight(workDone);

	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + dayWidth(), y + crossHeight);
	ctx.moveTo(x, y + crossHeight);
	ctx.lineTo(x + dayWidth(), y);
	ctx.closePath();
	ctx.stroke();

	if (workDone != this.load(dayNo))
	{
		ctx.beginPath();
		ctx.setLineDash([2]);
		ctx.moveTo(x + dayWidth(), y + crossHeight);
		ctx.lineTo(x, y + crossHeight);
		ctx.closePath();
		ctx.stroke();
		ctx.setLineDash([]);
	}
}

Project.prototype.mouseLoad = function (dayNo, y)
{
	return (this.load(dayNo) * workUnitHeight) - (y - this.y[this.relativeDayNo(dayNo)] - headerCtx.canvas.clientHeight);
};

Project.prototype.updateDayLoad = function (dayNo)
{
	assert(everythingIsOkay());

	if (dayNo == clicked.current) return; // Day did not change, do nothing.

	// Future values, if change is allowed.
	var clicked_previous = clicked.current;
	var clicked_current = dayNo;

	var futureChange = clicked_current - clicked_previous; // Change since last update.
	var touchingStart = clicked_current < this.start();
	var touchingDeadline = (this.deadline - this.lastWork() == 0);

	if (clicked.shift)
	{
		var touchingStart = this.start() == this.firstWork();
		var touchingDeadline = this.deadline == this.lastWork();

		if (futureChange < 0)
		{ // Moving left
			if (touchingStart)
			{
				if (!clicked.ctrl) return; // Change prohibited.
				this.dayLoad.push(0);
			}
			else
			{
				this.dayLoad.shift();
				this.dayLoad.push(0); // Add a 0 to the end of dayLoad, to preserve dayLoad.length.
			}
		}
		else
		{ // Moving right
			if (touchingDeadline)
			{
				if (!clicked.ctrl) return; // Change prohibited.
				this.deadline++;
				this.dayLoad.unshift(0); // Add to beginning, to preserve dayLoad.length.
			}
			else
			{
				this.dayLoad.pop(); // Remove last element
				this.dayLoad.unshift(0); // Add to beginning, to preserve dayLoad.length.
			}
		}
	}
	else
	{
		var touchingStart = clicked_current < this.start();
		var touchingDeadline = clicked_current > this.deadline;

		if (futureChange < 0)
		{ // Moving left
			if (touchingStart)
			{
				if (!clicked.ctrl) return; // Change prohibited.
				this.dayLoad[0] -= clicked.load;
				this.dayLoad.unshift(clicked.load);
			}
			else
			{
				this.dayLoad[this.relativeDayNo(clicked_current)] += clicked.load;
				this.dayLoad[this.relativeDayNo(clicked_previous)] -= clicked.load;
			}
		}
		else
		{ // Moving right
			if (touchingDeadline)
			{
				if (!clicked.ctrl) return; // Change prohibited.
				this.deadline++;
				this.dayLoad.push(clicked.load);
				this.dayLoad[this.relativeDayNo(clicked_previous)] -= clicked.load;
			}
			else
			{
				this.dayLoad[this.relativeDayNo(clicked_current)] += clicked.load;
				this.dayLoad[this.relativeDayNo(clicked_previous)] -= clicked.load;
			}
		}
	}

	clicked.previous = clicked_previous;
	clicked.current = clicked_current;

	assert(everythingIsOkay());

	draw();
}

Project.prototype.changeStart = function (newStart)
{
	if (newStart != this.start())
	{
		var startChange = this.start() - newStart;
		if (newStart < this.start())
		{
			var futureStart = this.start();
			for (var i = 0; i < startChange; i++)
			{
				--futureStart;
				if (futureStart < 0)
				{
					notification('Attempted changing of project start before the start of time, stopped.')
					return;
				}
				this.dayLoad.unshift(0);
			};
		}
		else
		{ // newStart > this.start() (moving right)
			for (var i = 0; i < -startChange; i++)
			{ // startChange is negative, so we need to make it positive.
				var futureStart = this.start() + i;
				if (futureStart > this.firstWork())
				{ // Allow moving start to equal firstWork, and then stop.
					notification('Cannot move project start to the left, as there is work there.');
					return;
				}
				else
				{
					this.dayLoad.shift();
				}
			};
		}
	}
}

Project.prototype.changeDeadline = function (newDeadline)
{
	if (newDeadline != this.deadline)
	{
		var deadlineChange = this.deadline - newDeadline;
		if (newDeadline < this.deadline)
		{ // Moving deadline left
			var futureDeadline = this.deadline;
			for (var i = 0; i < deadlineChange; i++)
			{
				--futureDeadline;
				if (futureDeadline < this.lastWork())
				{
					notification('Cannot move deadline to the left, as there is work there. Stopped.')
					return;
				}
				this.dayLoad.pop();
			};
		}
		else
		{ // newDeadline > this.deadline (moving right)
			for (var i = 0; i < -deadlineChange; i++)
			{ // deadlineChange is negative, so we need to make it positive.
				var futureDeadline = this.deadline + i;
				if (futureDeadline > dayCount)
				{
					notification('Deadline has touched the end of time, and shall now be stopped at the end of time.');
					return;
				}
				else
				{
					this.dayLoad.push(0);
				}
			};
		}
		this.deadline = newDeadline;
	}
}

Project.prototype.test = function ()
{
	assert(this.firstWork() >= this.start());
	assert(this.lastWork() <= this.end());
	assert(this.lastWork() <= this.deadline);

	assert(this.dayLoadLength() > 0);
	assert(this.dayLoad.length == (this.end() - this.start()));

	assert(this.start() >= 0);

	assert(this.workDone <= this.size())
	assert(this.size() > 0);

	for (var i = this.dayLoad.length - 1; i >= 0; i--)
	{
		assert(this.dayLoad[i] != undefined);
		assert(this.dayLoad[i] != NaN);
		assert(this.dayLoad[i] >= 0);
	};

	return true;
}

Project.prototype.spread = function ()
{
	var spreadStart = Math.max(this.start(), now);
	var relativeStart = this.relativeDayNo(spreadStart);
	var daysToSpread = this.end() - spreadStart;
	var amountSpread = this.size() - this.loadBefore(now);
	var extraWork = amountSpread % daysToSpread;
	var amountPerDay = (amountSpread - extraWork) / daysToSpread;

	for (var i = relativeStart; i < this.relativeDayNo(this.end()); i++)
	{
		this.dayLoad[i] = amountPerDay;
		if (extraWork > 0)
		{
			this.dayLoad[i] += 1;
			--extraWork;
		}
	};

	saveWork();
	draw();
}

Project.prototype.changeWork = function (amount)
{
	assert(selectedProject && selectedProject.project == this);

	if (amount < 0 && -amount >= this.size())
	{ // Handle deletion of project
		if (confirm('Do you wish to delete' + this.name + ' entirely?'))
		{
			this.delete();
		}
		else
		{
			return;
		}
	}

	if (amount < 0)
	{ // Handle subtracting work
		if (-amount > this.load(selectedProject.dayClicked))
		{
			// Check max() of this.firstWork() and now to prevent editing of past.
			for (var i = this.relativeDayNo(Math.max(this.firstWork(), now)); i < this.dayLoad.length; i++)
			{ // Since dayClicked is less than 0, we should start at firstWork().
				if (-amount > this.dayLoad[i])
				{
					amount += this.dayLoad[i]; // Since amount is negative, we need to add to it to decrease it.
					this.dayLoad[i] = 0;
				}
				else
				{
					this.dayLoad[i] += amount; // Since amount is negative, we need to add it to dayLoad[i] to decrease dayLoad.
				}
				if (amount == 0)
				{
					draw();
					return;
				}
			};
		}
		else
		{
			this.dayLoad[this.relativeDayNo(selectedProject.dayClicked)] += amount;
		}
	}
	else
	{
		this.dayLoad[this.relativeDayNo(selectedProject.dayClicked)] += amount;
	}

	saveWork();
	draw();
}

Project.prototype.delete = function ()
{
	if (!confirm('This is the last warning, do you really want to delete ' + this.name + '?')) return;
	notification('Deleting ' + this.name);
	for (var i = 0; i < projects.length; i++)
	{
		if (projects[i] == this)
		{
			projects.splice(i);
		}
	};
	draw();
	notification('Deleted ' + this.name);
	saveWork();
}

function addSelectedInfo(project)
{
	document.getElementById('workInput').value = ''; // Taken direct from clear, mostly b/c we don't want to hide and unhide an element.
	var projectElement = document.querySelector('footer .project');

	projectElement.style.visibility = 'visible';

	if (selectedProject && selectedProject.project == project)
	{
		if (selectedProject.ctrl)
		{
			document.getElementById('workInput').value = workToTime(project.load(selectedProject.dayClicked));
		}
		else
		{
			var unitsAbove = project.loadBefore(selectedProject.dayClicked, (project.load(selectedProject.dayClicked) - selectedProject.load)); // loadBefore allows us to calculate over multiple days
			var minutesAbove = unitsAbove % 60;
			var hoursAbove = (unitsAbove - minutesAbove) / 60;
			document.getElementById('workInput').value = workToTime(hoursAbove * 60 + minutesAbove);
		}
	}

	var daysBeforeNow = 0;

	if (project.relativeDayNo(now) > 0)
	{
		daysBeforeNow = project.relativeDayNo(now);
	}

	if (daysBeforeNow > project.dayLoad.length)
	{
		daysBeforeNow = project.dayLoad.length;
	}

	document.getElementById('name').innerHTML = project.name;
	document.getElementById('customer_name').innerHTML = project.customer_name;
	document.getElementById('start').value = dateText(project.start(), true);
	document.getElementById('deadline').value = dateText(project.deadline, true);
	document.getElementById('days').innerHTML = daysBeforeNow + '/' + project.dayLoad.length; // Add 1 to now b/c now includes now.
	document.getElementById('hours').innerHTML = workToTime(project.workDone) + ' / ' + workToTime(project.size());
	document.getElementById('workInDayClicked').innerHTML = workToTime(project.load(selectedProject.dayClicked));
}

function hideSelectedInfo()
{
	document.querySelector('footer .project').style.visibility = 'hidden';
	document.getElementById('workInput').value = '';
}
