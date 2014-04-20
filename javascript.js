"use strict";

var canvas = document.getElementById('background');
var mouse = {x: 0, y: 0};
var dayCount = 10;
var screenWidth = document.body.clientWidth;
var fullDayWidth = Math.floor(screenWidth/dayCount);
var borderWidth = 3;
var projectPadding = 0;
var projectHeight = 100;
var headerSize = 40;
var hourHeight = 100;

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
		size: 2,
		color: 'lightblue'
	},
	{
		name: 'Project #2',
		deadline: 2,
		size: 4,
		color: '#BADA55'
	},
	{
		name: 'Project #3',
		deadline: 1,
		size: 4,
		color: 'cyan'
	}
];

// Create days
canvas.width = screenWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d')
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, screenWidth, window.innerHeight);
for (var dayNo = 0; dayNo < dayCount; dayNo++) {
	drawBorder(ctx, dayNo);

	ctx.textAlign = 'center';
	ctx.font = 'bold 12pt Arial';
	ctx.fillStyle = 'black';
	ctx.fillText(dateText(dayNo), dayStart(dayNo) + dayWidth()/2, 20);
};

drawBorder(ctx, dayCount);


forEach(projects, function createProjectDiv(index, project) {
	var projectDiv = document.createElement('div');
	
	projectDiv.classList.add('project');

	// project.deadline = Math.floor(Math.random()*dayCount);
	// project.size = Math.ceil(Math.random()*dayCount/2);

	var projectStart = project.deadline;



	var projectWidth = project.size*(fullDayWidth) - borderWidth;
	var projectEnd = dayStart(project.start);
	var projectHeight = project.size*hourHeight;
	
	projectDiv.style.backgroundColor = project.color;
	projectDiv.style.opacity = 0.9;
	projectDiv.style.width = projectWidth + 'px';
	projectDiv.style.top = (projectHeight + projectPadding)*index + headerSize + 'px';
	projectDiv.style.left = dayStart(projectStart) + 'px';
	
	projectDiv.innerHTML = '<p>' + project.name + '<br>' + 'Deadline: ' + project.deadline + '<br>Size: ' + project.size + '</p>';

	projectDiv = document.body.appendChild(projectDiv);
});

function leftBorder(dayNo) {
	return dayNo*fullDayWidth;
}

function dayStart(dayNo) {
	return leftBorder(dayNo) + borderWidth;
}

function dateText(dayNo) {
	return dayNo;
}

function dayWidth() {
	return fullDayWidth - borderWidth;
}

function drawBorder(ctx, dayNo) {
	ctx.fillStyle = 'red';
	ctx.fillRect(leftBorder(dayNo), 0, borderWidth, window.innerHeight);
}

document.addEventListener('mousemove', function(e){ 
	mouse.x = e.clientX || e.pageX; 
	mouse.y = e.clientY || e.pageY;
}, false);