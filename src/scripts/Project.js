var dateHelpers = require('./helpers/date-helpers'),
	projectCanvas = require('./project-draw'),
	dayHelpers = require('./helpers/day-helpers'),
	projectHelpers = require('./helpers/project-helpers'),
	footer = require('./footer'),
	globals = require('./globals'),

	assert = require('assert');

var projectID = 0;

function Project(args) {
	this.name = args.name;
	this.customerName = args.customer || 'Unknown Joe';
	this.deadline = dateHelpers.fromMomentToDay(dateHelpers.fromDateToMoment(args.deadline));
	this.color = args.color || 'aqua';

	this.loadDayLoad(args.dayLoad);

	this.workDone = args.workDone || 0;

	// Initialize variables
	this.y = [];
	this.projectID = projectID;

	projectID++;
}

Project.prototype.loadDayLoad = function (inputDayLoad) {
	var dayLoadKeys = Object.keys(inputDayLoad);

	dayLoadKeys.sort(function (a, b) {
		return dateHelpers.fromDateToMoment(a).isAfter(dateHelpers.fromDateToMoment(b));
	});

	this.dayLoad = [];

	for (var keyID = 0; keyID <= this.deadline - dateHelpers.fromDateToDay(dayLoadKeys[0]); keyID++) {
		var value = inputDayLoad[dayLoadKeys[keyID]];
		if (value) {
			this.dayLoad[keyID] = value;
		} else {
			this.dayLoad[keyID] = 0;
		}
	}
};

Project.prototype.start = function () {
	return this.end() - this.dayLoad.length;
};

Project.prototype.end = function () {
	return this.deadline + 1;
};

Project.prototype.firstWork = function () {
	for (var worklessDays = 0; worklessDays < this.dayLoad.length; worklessDays++) {
		if (this.dayLoad[worklessDays] !== 0) {
			return this.start() + worklessDays;
		}
	}
	return this.end(); // Shouldn't happen, unless project is workless (dayLoad = [0..0])
};

Project.prototype.lastWork = function () {
	return this.firstWork() + this.dayLoadLength() - 1; // Subtract 1 from dayLoadLength to exclude the day of firstWork.
};

Project.prototype.dayLoadLength = function () {
	return this.dayLoad.trim(0).length;
};

Project.prototype.relativeDayNo = function (dayNo) {
	return dayNo - this.start();
};

Project.prototype.load = function (dayNo) { // May be called with dayNo that is not in project.dayLoad.
	var relativeLoad = this.dayLoad[this.relativeDayNo(dayNo)];
	return relativeLoad >= 0 ? relativeLoad : 0;
};

Project.prototype.maxY = function (dayNo) {
	return this.y[this.relativeDayNo(dayNo)] + this.height(dayNo);
};

Project.prototype.height = function (dayNo) {
	return this.toHeight(this.load(dayNo));
};

Project.prototype.toHeight = function (load) {
	assert(load >= 0, 'Load is greater than or equal to 0.');
	if (load !== 0 && load < globals.minimumWork) { // Set all project heights to at least minimumWork.
		load = globals.minimumWork;
	}
	return (load / 15) * globals.workUnitHeight * 15;
};

Project.prototype.drawToCanvas = function (canvas, dayNo) {
	if (this.load(dayNo) === 0) { // This day of the canvas has no work, and should be deleted
		canvas.parentElement.removeChild(canvas);
		return;
	}

	var ctx = canvas.getContext('2d');
	var columnWidth = projectCanvas.getColumnElement(dayNo).clientWidth;
	var projectHeight = this.height(dayNo);

	canvas.height = projectHeight;
	canvas.width = columnWidth * 0.85;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	this.drawText(ctx, dayNo);
	this.drawHoursDone(ctx, dayNo);

	if (projectCanvas.selectedProject() && projectCanvas.selectedProject().project === this) {
		this.drawLadder(ctx, dayNo);
	}
};

Project.prototype.drawText = function (ctx, dayNo) {
	var projectHeight = ctx.canvas.clientHeight;
	if (projectHeight >= globals.minimumWork) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.font = '15px Arial';
		ctx.fillText(this.name, ctx.canvas.clientWidth / 2, 0, ctx.canvas.clientWidth);
		if (projectHeight >= globals.minimumWork * 2) {
			ctx.textBaseline = 'bottom';
			ctx.fillText(dateHelpers.workToTime(this.doneLoad(dayNo)) + '/' + dateHelpers.workToTime(this.load(dayNo)),
				ctx.canvas.clientWidth / 2, projectHeight, ctx.canvas.clientWidth);
		}
	}
};

Project.prototype.canvasWidth = function (ctx) {
	return ctx.canvas.clientWidth;
};

Project.prototype.drawHoursDone = function (ctx, dayNo) {
	var workDone = this.doneLoad(dayNo);
	if (workDone === 0) return; // Exit if no hours to draw.
	assert(workDone > 0);

	var crossHeight = this.toHeight(workDone);
	var crossWidth = this.canvasWidth(ctx);

	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(crossWidth, crossHeight);
	ctx.moveTo(0, crossHeight);
	ctx.lineTo(crossWidth, 0);
	ctx.closePath();
	ctx.stroke();

	if (workDone != this.load(dayNo)) {
		ctx.beginPath();
		ctx.setLineDash([2]);
		ctx.moveTo(crossWidth, crossHeight);
		ctx.lineTo(0, crossHeight);
		ctx.closePath();
		ctx.stroke();
		ctx.setLineDash([]);
	}
};

Project.prototype.drawLadder = function (ctx, dayNo) {
	ctx.fillStyle = 'red';
	for (var i = 1; i < Math.ceil(this.load(dayNo) / 15); i++) { // Divide load by 15 to get 15 minute chunks
		//		var x = dayHelpers.dayStart(dayNo);
		var y = i * globals.workUnitHeight * 15;
		var delimeterLength = i % 4 === 0 ? dayHelpers.dayWidth() : dayHelpers.dayWidth() / 10; // For every hour, draw across whole day.

		ctx.fillRect(0, y, delimeterLength, globals.borderWidth);
	}
};

Project.prototype.doneLoad = function (dayNo) {
	var workDone = this.workDone;

	for (var i = 0; i < this.dayLoad.length && i < this.relativeDayNo(dayNo); i++) {
		workDone -= this.dayLoad[i]; // Remove the amount of work done in that day.
		if (workDone < 0) return 0;
	}

	return Math.min(workDone, this.dayLoad[i]) || 0; // Does not allow workDone to exceed amount of work in this day.
};

Project.prototype.loadBefore = function (dayNo, load) {
	var totalWork = 0;
	for (var i = 0; i < this.dayLoad.length && i < this.relativeDayNo(dayNo); i++) {
		totalWork += this.dayLoad[i]; // Add the amount of hours done in this day.
	}

	if (load !== undefined) totalWork += load; // Adds load given, but since load can be omitted, can skip this.

	return totalWork;
};

Project.prototype.loadAfter = function (dayNo, load) {
	return this.size() - this.loadBefore(dayNo, load);
};

Project.prototype.size = function () {
	var size = 0;
	for (var i = this.dayLoad.length - 1; i >= 0; i--) {
		size += this.dayLoad[i];
	}
	return size;
};

Project.prototype.mouseLoad = function (dayNo, y) {
	return (this.load(dayNo) * globals.workUnitHeight) - (y - globals.dayTitleHeight - globals.headerCtx.canvas.clientHeight);
};

Project.prototype.updateDayLoad = function (dayNo) {
	assert(this.test());

	var clicked = projectCanvas.clicked();

	if (dayNo == clicked.current) return; // Day did not change, do nothing.

	// Future values, if change is allowed.
	var clickedPrevious = clicked.current;
	var clickedCurrent = dayNo;

	var futureChange = clickedCurrent - clickedPrevious; // Change since last update.
	var touchingStart = clickedCurrent < this.start();
	var touchingDeadline = (this.deadline - this.lastWork() === 0);

	if (clicked.shift) {
		touchingStart = this.start() == this.firstWork();
		touchingDeadline = this.deadline == this.lastWork();

		if (futureChange < 0) { // Moving left
			if (touchingStart) {
				if (!clicked.ctrl) return; // Change prohibited.
				this.dayLoad.push(0);
			} else {
				this.dayLoad.shift();
				this.dayLoad.push(0); // Add a 0 to the end of dayLoad, to preserve dayLoad.length.
			}
		} else { // Moving right
			if (touchingDeadline) {
				if (!clicked.ctrl) return; // Change prohibited.
				this.deadline++;
				this.dayLoad.unshift(0); // Add to beginning, to preserve dayLoad.length.
			} else {
				this.dayLoad.pop(); // Remove last element
				this.dayLoad.unshift(0); // Add to beginning, to preserve dayLoad.length.
			}
		}
	} else {
		touchingStart = clickedCurrent < this.start();
		touchingDeadline = clickedCurrent > this.deadline;

		if (futureChange < 0) { // Moving left
			if (touchingStart) {
				if (!clicked.ctrl) return; // Change prohibited.
				this.dayLoad[0] -= clicked.load;
				this.dayLoad.unshift(clicked.load);
			} else {
				this.dayLoad[this.relativeDayNo(clickedCurrent)] += clicked.load;
				this.dayLoad[this.relativeDayNo(clickedPrevious)] -= clicked.load;
			}
		} else { // Moving right
			if (touchingDeadline) {
				if (!clicked.ctrl) return; // Change prohibited.
				this.deadline++;
				this.dayLoad.push(clicked.load);
				this.dayLoad[this.relativeDayNo(clickedPrevious)] -= clicked.load;
			} else {
				this.dayLoad[this.relativeDayNo(clickedCurrent)] += clicked.load;
				this.dayLoad[this.relativeDayNo(clickedPrevious)] -= clicked.load;
			}
		}
	}


	clicked.previous = clickedPrevious;
	clicked.current = clickedCurrent;

	projectCanvas.draw();

	assert(this.test());
};

Project.prototype.changeStart = function (newStart) {
	var futureStart;
	var i;

	if (newStart != this.start()) {
		var startChange = this.start() - newStart;
		if (newStart < this.start()) {
			futureStart = this.start();
			for (i = 0; i < startChange; i++) {
				--futureStart;
				if (futureStart < 0) {
					footer.notify('Attempted changing of project start before the start of time, stopped.');
					return;
				}
				this.dayLoad.unshift(0);
			}
		} else { // newStart > this.start() (moving right)
			for (i = 0; i < -startChange; i++) { // startChange is negative, so we need to make it positive.
				futureStart = this.start() + i;
				if (futureStart > this.firstWork()) { // Allow moving start to equal firstWork, and then stop.
					footer.notify('Cannot move project start to the left, as there is work there.');
					return;
				} else {
					this.dayLoad.shift();
				}
			}
		}
	}
};

Project.prototype.changeDeadline = function (newDeadline) {
	var i;
	var futureDeadline;
	if (newDeadline != this.deadline) {
		var deadlineChange = this.deadline - newDeadline;
		if (newDeadline < this.deadline) { // Moving deadline left
			futureDeadline = this.deadline;
			for (i = 0; i < deadlineChange; i++) {
				--futureDeadline;
				if (futureDeadline < this.lastWork()) {
					footer.notify('Cannot move deadline to the left, as there is work there. Stopped.');
					return;
				}
				this.dayLoad.pop();
			}
		} else { // newDeadline > this.deadline (moving right)
			for (i = 0; i < -deadlineChange; i++) { // deadlineChange is negative, so we need to make it positive.
				futureDeadline = this.deadline + i;
				if (futureDeadline > globals.dayCount) {
					footer.notify('Deadline has touched the end of time, and shall now be stopped at the end of time.');
					return;
				} else {
					this.dayLoad.push(0);
				}
			}
		}
		this.deadline = newDeadline;
	}
};

Project.prototype.test = function () {
	assert(this.firstWork() >= this.start());
	assert(this.lastWork() <= this.end());
	assert(this.lastWork() <= this.deadline);

	assert(this.dayLoadLength() > 0);
	assert(this.dayLoad.length == (this.end() - this.start()));

	assert(this.start() >= 0);

	assert(this.workDone <= this.size());
	assert(this.size() > 0);

	for (var i = this.dayLoad.length - 1; i >= 0; i--) {
		assert(this.dayLoad[i] !== undefined);
		assert(!isNaN(this.dayLoad[i]));
		assert(this.dayLoad[i] >= 0);
	}

	return true;
};

Project.prototype.spread = function (start, end) {
	var spreadStart = start !== undefined ? start : Math.max(this.start(), globals.now);
	var relativeStart = this.relativeDayNo(spreadStart);
	var daysToSpread = end !== undefined ? end : this.end() - spreadStart;
	var amountSpread = this.loadAfter(globals.now);
	var extraWork = amountSpread % daysToSpread;
	var amountPerDay = (amountSpread - extraWork) / daysToSpread;

	for (var i = relativeStart; i < this.relativeDayNo(this.end()); i++) {
		this.dayLoad[i] = amountPerDay;
		if (extraWork > 0) {
			this.dayLoad[i] += 1;
			--extraWork;
		}
	}

	projectHelpers.saveWork();
	projectCanvas.draw();
};

Project.prototype.collapse = function (centerDayNo) {
	var now = globals.now;
	var amountCollapse = this.loadAfter(now);

	for (var i = this.relativeDayNo(now); i < this.relativeDayNo(this.end()); i++) {
		this.dayLoad[i] = 0;
	}

	this.dayLoad[this.relativeDayNo(centerDayNo)] = amountCollapse;

	projectHelpers.saveWork();
	projectCanvas.draw();
};

Project.prototype.changeWork = function (amount) {
	var selectedProject = projectCanvas.selectedProject();
	var now = globals.now;
	assert(selectedProject && selectedProject.project == this);

	if (amount < 0 && -amount >= this.size()) { // Handle deletion of project
		footer.notify('Deleting ' + this.name);
		this.delete();
		return;
	}

	if (amount < 0) { // Handle subtracting work
		if (-amount > this.load(selectedProject.dayClicked)) {
			// Check max() of this.firstWork() and now to prevent editing of past.
			for (var i = this.relativeDayNo(Math.max(this.firstWork(), now)); i < this.dayLoad.length; i++) { // Since dayClicked is less than 0, we should start at firstWork().
				if (-amount > this.dayLoad[i]) {
					amount += this.dayLoad[i]; // Since amount is negative, we need to add to it to decrease it.
					this.dayLoad[i] = 0;
				} else {
					this.dayLoad[i] += amount; // Since amount is negative, we need to add it to dayLoad[i] to decrease dayLoad.
				}
				if (amount === 0) {
					projectCanvas.draw();
					return;
				}
			}
		} else {
			this.dayLoad[this.relativeDayNo(selectedProject.dayClicked)] += amount;
		}
	} else {
		this.dayLoad[this.relativeDayNo(selectedProject.dayClicked)] += amount;
	}

	projectHelpers.saveWork();
	projectCanvas.draw();
};

Project.prototype.delete = function () {
	footer.notify('Deleting ' + this.name);
	var projects = projectHelpers.projects;
	for (var i = 0; i < projects.length; i++) {
		if (projects[i] == this) {
			projects.splice(i);
		}
	}
//	drawing.draw();
	footer.notify('Deleted ' + this.name);
	projectHelpers.saveWork();
};

module.exports.Project = Project;
