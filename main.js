"use strict";

var aProject, clicked, moused, ctx, htmlBody, days_page, footer, canvas, scrollbar, firstDayBox, screenWidth, screenHeight, fullDayWidth, globalNewProject, firstDay, daysPerPage, __measuretext_cache__;

var mouse = {x: 0, y: 0};
var dayCount = 365*100;
var borderWidth = 1;
var projectPadding = 0;
var headerSize = 40;
var footerSize = 30;
var hourHeight = 100;
var scheduledProjects = 0;
var daySize = 2;
var now = 0;


var intervalID = 0;

document.addEventListener('DOMContentLoaded', init, false);

function init() {
	aProject = projects[4]; // For debugging!
	canvas = document.getElementById('canvas');
	footer = document.getElementsByTagName('footer')[0];
	htmlBody = document.querySelector('body');
	ctx = canvas.getContext('2d');
	
	// SCROLLBAR //

	firstDayBox = document.getElementById('scrollvalue');
	days_page = document.getElementById('days_page');
	scrollbar = document.getElementById('scrollbar');
	
	scrollbar.addEventListener('input', onScrollbarInput, false);
	firstDayBox.addEventListener('change', onFirstDayChange, false);
	days_page.addEventListener('change', onDaysPageChange, false);

	firstDay = now;
	daysPerPage = 12; // For now, always start at 7 (b/c 7 days in a week) on refresh.

	footerSize = footer.clientHeight;
	scrollbar.value = firstDay;
	firstDayBox.value = firstDay;
	days_page.value = daysPerPage;

	// END SROLLBAR //

	window.addEventListener('resize', onResizeWindow, false);

	canvas.addEventListener('mousedown', function(mouseEvent) {
		var project = getProjectByCoordinates(mouse.x, mouse.y);

		if (project) { // If we didn't click on a project; don't do anything.
			var dayNo = getDay(mouse.x);
			clicked = {
				'project': project,
				'start': dayNo,
				'current': dayNo, // In the case that the user doesn't move mouse after clicking
				'load': project.mouseLoad(dayNo, mouse.y),
				'shift': mouseEvent.shiftKey,
				'ctrl': mouseEvent.ctrlKey,
			}

			// console.log(clicked.load, clicked.start, clicked.current);
		}
	}, false);

	canvas.addEventListener('mouseup', function() {
		if (clicked) {
			if (clicked.start != clicked.current) {
				var project = clicked.project;

				if (clicked.shift) {
					project.startPoint = project.start();
				} else {
					var loadStart = clicked.project.load(clicked.start);
					var loadCurrent = clicked.project.load(clicked.current);

					project.dayLoad[project.relativeDayNo(clicked.start)] = loadStart;
					project.dayLoad[project.relativeDayNo(clicked.current)] = loadCurrent;
				}
			}

			clicked = null;
			moused = null;
			draw();
		}
	}, false);

	document.getElementById('new-project').addEventListener('click', function(){
		dialog.style.display = 'block';
	}, false);

	document.getElementById('new-project-create').addEventListener('click', function(e) {
		var dialog = document.querySelector('#dialog');
		var name = dialog.querySelector('.name');
		var deadline = dialog.querySelector('.deadline');
		var size = dialog.querySelector('.size');
		var color = dialog.querySelector('.color');
		
		projects.push({
			'name': name.value,
			'deadline': Number(deadline.value),
			'size': Number(size.value),
			'color': color.value
		});

		// Reset values;
		name.value = '';
		deadline.value = '';
		size.value = '';
		color.value = '';
		dialog.style.display = 'none';

		draw();
	}, false);

	document.addEventListener('mousemove', function(e){ 
		mouse.x = e.clientX || e.pageX; 
		mouse.y = e.clientY || e.pageY;

		var project = getProjectByCoordinates(mouse.x, mouse.y);
		var dayNo = getDay(mouse.x);
		
		if (moused && (moused.project != project || moused.day != dayNo)) { // If we changed days or projects, we need to erase the old lines.
			moused = null;
			draw();
		}

		if (project) {
				moused = {};
				moused.project = project;
				moused.day = dayNo;
				if (!clicked) project.drawLadder(dayNo, project.y[project.relativeDayNo(dayNo)]);
		}

		if (!clicked) { // Nothing being moved, we are done.
			return;
		}

		if (dayNo == clicked.current) { // Day did not change, do nothing.
			return;
		}

		var futureChange = dayNo - clicked.start;
		var futureStart = clicked.shift ? clicked.project.startPoint + futureChange : clicked.project.start();
		var futureEnd = futureStart + (clicked.project.end() - clicked.project.start());//clicked.project.dayLoadLength();
		console.log(futureEnd);
		if (dayNo >= futureEnd) { // User wants to increase project end.
			futureEnd = dayNo + 1;
		}

		if (dayNo < clicked.project.start() && !clicked.shift) { // Moving to the left of start is not allowed w/o ctrl.
			return;
		}

		if (futureEnd > clicked.project.end()) { // Moving past deadline is not allowed.
			return;
		}

		// console.log(dayNo, clicked.current, futureEnd, clicked.project.end(), clicked.project.start());
		clicked.current = dayNo;
		draw();

		// var pixelsAway = 20;
		// var timePush = 400;
		// if (mouse.x > screenWidth - pixelsAway) { // pixelsAway from right side
		// 	if (!intervalID && firstDay < dayCount) {
		// 		intervalID = setInterval(function() {
		// 			++firstDay;
		// 			updateFirstDay();
		// 			draw();

		// 			clearInterval(intervalID);
		// 			intervalID = null;
		// 		}, timePush);
		// 	}
		// } else if (mouse.x < pixelsAway) { // pixelsAway from left side
		// 	if (!intervalID && firstDay > 0) {
		// 		intervalID = setInterval(function() {
		// 			--firstDay;
		// 			updateFirstDay();
		// 			draw();

		// 			clearInterval(intervalID);
		// 			intervalID = null;
		// 		}, timePush);
		// 	}
		// } else if (intervalID) {
		// 	clearInterval(intervalID);
		// 	intervalID = null;
		// }
	}, false);

	onResizeWindow(); // XXX: Cannot call onResize(); b/c window.onresize seems to interfere.
	onDaysPageChange(); // XXX: Also calls draw(), and draw() called in onResizeWindow; double draw.
}

function draw() {
	drawDays();
}

function drawBorder(dayNo) {
	var oldColor = ctx.fillStyle;
	if (dayNo == now) {
		ctx.fillStyle = 'red';
	}
	ctx.fillRect(leftBorder(dayNo), 0, borderWidth, screenHeight);
	ctx.fillStyle = oldColor;
}

function drawProjects(dayNo) {
	var foundProjects = getProjects(dayNo);
	var offsetTop = headerSize;
	if (clicked && clicked.project && !foundProjects.contains(clicked.project)) foundProjects.push(clicked.project);

	for (var i = 0; i < foundProjects.length; i++) {
		offsetTop = foundProjects[i].draw(dayNo, offsetTop); // Returns the new offsetTop
	};
}

function drawDays() {
	var lastDay = firstDay + daysPerPage;

	scheduledProjects = 0;
	for (var i = 0; i < projects.length; i++) {
		calcProjectVars(projects[i], i);
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height); // Should be optimized to be more efficient.

	ctx.fillRect(0, headerSize, leftBorder(lastDay), borderWidth);
	ctx.fillRect(0, canvas.height-1, leftBorder(lastDay), borderWidth); // Draws a line to 'finish up canvas'
	ctx.fillRect(0, daySize*hourHeight + headerSize, leftBorder(lastDay), borderWidth);

	for (var dayNo = firstDay; dayNo < firstDay + daysPerPage; dayNo++) {
		drawBorder(dayNo);

		ctx.textAlign = 'center';
		ctx.font = '12pt bold Arial';
		ctx.fillText(dateText(dayNo), dayStart(dayNo) + dayWidth()/2, headerSize/2, fullDayWidth);

		drawProjects(dayNo);
	};

	drawBorder(lastDay);
}
