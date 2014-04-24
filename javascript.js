"use strict";

var canvas, screenWidth, fullDayWidth, timeout;

var mouse = {x: 0, y: 0};
var dayCount = 10;
var borderWidth = 1;
var projectPadding = 0;
var projectHeight = 100;
var headerSize = 40;
var hourHeight = 100;
var scheduledProjects = 0;
var daySize = 2;

// Better implementation of [].forEach.call(...)
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]); // passes back stuff we need
  }
};

var projects = [
	{
		name: 'Project #1',
		deadline: 0,
		size: 1,
		color: 'lightblue'
	},
	{
		name: 'Project #2',
		deadline: 0,
		size: 1,
		color: '#BADA55'
	},
	{
		name: 'Project #3',
		deadline: 1,
		size: 1,
		color: 'cyan'
	},
];

function leftBorder(dayNo) {
	return dayNo*fullDayWidth;
}

function dayStart(dayNo) {
	return leftBorder(dayNo) + borderWidth;
}


function dayWidth() {
	return fullDayWidth - borderWidth;
}

function dateText(dayNo) {
	return dayNo;
}

function drawBorder(ctx, dayNo) {
	ctx.fillStyle = 'red';
	ctx.fillRect(leftBorder(dayNo), 0, borderWidth, window.innerHeight);
}

function dayLoad(dayNo) {
	var dayLoad = 0;

	for (var i = 0; i < scheduledProjects; i++) {
		var project = projects[i];
		if (project.start <= dayNo && dayNo <= project.end) {
			dayLoad += project.days[dayNo - project.start];
		}
	}

	return dayLoad;
}

function newProject(name, deadline, size, color) {
	color = color || 'red';
	var project = {
		'name': name,
		'deadline': deadline,
		'size': size,
		'color': color
	};

	// var newProject = document.createElement('div');
	// newProject.classList.add('project', 'not-scheduled');

	// newProject.style.backgroundColor = project.color;
	// newProject.style.opacity = 0.6;

	// newProject.style.top = '200px';
	// newProject.style.left = '200px';

	// newProject.innerHTML = '<p>' + project.name + '<br>' + 'Deadline: ' + project.deadline + '<br>Size: ' + project.size + '</p>';
	var newProject = createProjectDiv(project);

	newProject.classList.add('not-scheduled');

	newProject = document.getElementById('projects').appendChild(newProject);
	newProject.style.top = newProject.offsetTop + hourHeight*daySize;

	newProject.addEventListener('mousedown', function(){
		newProject.offsetTop = mouse.y;
		newProject.offsetLeft = mouse.x;

		// projects.push(project);
		// draw();
	}, false);

	return newProject;
}

function createProjectDiv(project) {
	var projectWidth = fullDayWidth;
	var projectHeight = project.size*hourHeight;


	var projectDiv = document.createElement('div');
	
	projectDiv.classList.add('project');
	projectDiv.id += 'project-' + project.id;

	projectDiv.style.backgroundColor = project.color;
	projectDiv.style.opacity = 0.6;
	projectDiv.style.width = projectWidth + 'px';
	projectDiv.style.height = projectHeight + 'px';

	
	projectDiv.innerHTML = '<p>' + project.name + '<br>' + 'Deadline: ' + project.deadline + '<br>Size: ' + project.size + '</p>';

	return projectDiv;
}

var calcProjectVars = function calcProjectVars(index, project) {
	project.start = project.deadline;
	project.end = project.deadline;
	project.id = index;
	
	while (dayLoad(project.start) + project.size > daySize && project.start > 0) {
		--project.start;
		--project.end;
	}

	project.days = [];

	project.days.push(project.size);

	var projectDiv = createProjectDiv(project);

	
	var projectTop = dayLoad(project.start)*hourHeight + headerSize;
	var projectLeft = dayStart(project.start);
	projectDiv.style.top = projectTop + 'px';
	projectDiv.style.left = projectLeft + 'px';

	document.getElementById('projects').appendChild(projectDiv);

	++scheduledProjects;
}

function createDays() {
	canvas.width = screenWidth;
	canvas.height = window.innerHeight;
	var ctx = canvas.getContext('2d')
	// ctx.fillStyle = 'white';
	// ctx.fillRect(0, 0, screenWidth, window.innerHeight);
	ctx.fillStyle = 'red';
	ctx.fillRect(0, headerSize, leftBorder(dayCount), borderWidth);
	ctx.fillRect(0, daySize*hourHeight + headerSize, leftBorder(dayCount), borderWidth);
	drawBorder(ctx, dayCount);
	for (var dayNo = 0; dayNo < dayCount; dayNo++) {
		drawBorder(ctx, dayNo);

		ctx.textAlign = 'center';
		ctx.font = 'bold 12pt Arial';
		ctx.fillStyle = 'black';
		ctx.fillText(dateText(dayNo), dayStart(dayNo) + dayWidth()/2, 20);
	};
}

function draw() {
	// (Re)define global variables.
	canvas = document.getElementById('background');
	screenWidth = document.body.clientWidth;
	fullDayWidth = Math.floor(screenWidth/dayCount);
	
	createDays(); // XXX: Should clear before draw; perhaps check if need to

	scheduledProjects = 0; // Reset scheduled projects.
	document.getElementById('projects').innerHTML = ''; // Empty created projects.
	forEach(projects, calcProjectVars);
}


document.addEventListener('mousemove', function(e){ 
	mouse.x = e.clientX || e.pageX; 
	mouse.y = e.clientY || e.pageY;
}, false);

// document.addEventListener('DOMContentLoaded', addthing, true); // Draw projects, etc.
window.addEventListener('resize', draw, false);
window.addEventListener('scroll', draw, false);
document.addEventListener('DOMContentLoaded', draw, true); // Draw projects, etc.