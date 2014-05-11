function Project(args) { // args: name, deadline, size, color, dayLoad
	this.name = args.name;
	this.deadline = args.deadline;
	this.size = args.size;
	this.color = args.color || 'aqua';
	this.dayLoad = args.dayLoad || [args.size]; // If no dayLoad supplied, default to just having it be single-day

	// Initialize variables
	this.x = [];
	this.y = [];
	this.startPoint = this.end() - this.dayLoad.length;
}

Project.prototype.start = function () {
	var start = this.startPoint;

	if (clicked && clicked.project && clicked.shift && this == clicked.project) {
		var clickedChange = clicked.current - clicked.start;

		if (start + clickedChange + this.dayLoadLength() <= this.end()) {
			start += clickedChange;
		}

		if (start < 0) start = 0; // Prevents project escaping day 0
	}

	return start;
}

Project.prototype.end = function () {
	return this.deadline + 1;
}

Project.prototype.dayLoadLength = function () {
	return this.dayLoad.trimZeros().length;
	// return this.dayLoad.length;
}

Project.prototype.relativeDayNo = function (dayNo) {
	return dayNo - this.start();
}

Project.prototype.load = function (dayNo) { // May be called with dayNo that is not valid for said project.
	var project = this;

	if (clicked && !clicked.shift && clicked.project == project) {
		var clickedLoad = clicked.load;
		var loadStart = (dayNo == clicked.start) ? clickedLoad : 0;
		var loadCurrent = (dayNo == clicked.current) ? clickedLoad : 0;

		if (project.relativeDayNo(dayNo) < 0) {
			return loadCurrent;
		}

		return (project.dayLoad[project.relativeDayNo(dayNo)] - loadStart + loadCurrent);
	} else {
		return project.dayLoad[project.relativeDayNo(dayNo)];
	}
}

Project.prototype.summary = function () {
	return [
		this.name,
		'Size: ' +  this.size,
		'Deadline: ' +  this.deadline,
		'Start: ' + this.start()
	].join('\n');
}

Project.prototype.maxX = function (dayNo) {
	return this.x[this.relativeDayNo(dayNo)] + dayWidth();
}

Project.prototype.maxY = function (dayNo) {
	return this.y[this.relativeDayNo(dayNo)] + this.height(dayNo);
}

Project.prototype.height = function(dayNo) {
	return this.load(dayNo)*hourHeight;
}

Project.prototype.draw = function (dayNo, offsetTop) {
	var project = this;

	var oldFillStyle = ctx.fillStyle;
	var offsetLeft = dayStart(dayNo);
	var projectHeight = project.height(dayNo);

	var relativeDayNo = project.relativeDayNo(dayNo);

	project.x[relativeDayNo] = offsetLeft;
	project.y[relativeDayNo] = offsetTop;

	if (!projectHeight) {
		return offsetTop;
	}
	

	// Draws rectangle (project)
	ctx.fillStyle = project.color;
	ctx.fillRect(offsetLeft, offsetTop, dayWidth(), projectHeight);

	// Adds name text to project
	multilineText(project.summary(), offsetLeft + dayWidth()/2, offsetTop, dayWidth());

	ctx.fillStyle = oldFillStyle;

	offsetTop += projectHeight;

	return offsetTop;
}

Project.prototype.drawLadder = function (dayNo, offsetTop) {
	var oldFillStyle = ctx.fillStyle;
	ctx.fillStyle = 'red';
	for (var i = 1; i < this.load(dayNo); i++) {
		var x = dayStart(dayNo);
		var y = offsetTop + i*hourHeight;

		ctx.fillRect(x, y, dayWidth(), borderWidth);
	};
	ctx.fillStyle = oldFillStyle;
}

Project.prototype.mouseLoad = function (dayNo, y) {
	var relativeDayNo = this.relativeDayNo(dayNo);
	return this.load(dayNo) - Math.floor((y - this.y[relativeDayNo])/hourHeight);
};