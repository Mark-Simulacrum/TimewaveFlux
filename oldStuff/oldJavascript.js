// Old Code that may or may not be needed in the future.

// function feasibleProject(project) {
// 	project.start = project.deadline;
// 	project.end = project.deadline;

// 	while (dayLoad(project.start) + project.size > daySize && project.start > 0 && project.start > now) {
// 		--project.start;
// 		--project.end;
// 	}

// 	if (dayLoad(project.end) + project.size > daySize) {
// 		return false;
// 	}
// 	if (project.start < now ) {
// 		return false;
// 	}
// 	return true;
// }

function newProject(name, size, color) {
	color = color || 'red';
	var project = {
		'name': name,
		'deadline': 0,
		'size': size,
		'color': color
	};

var newProject = createProjectDiv(project);

	newProject.classList.add('not-scheduled');

	newProject = document.getElementById('projects').appendChild(newProject);
	newProject.style.top = screenHeight - project.size*workUnitHeight + 'px';
	newProject.style.left = fullDayWidth*now + 'px';

	globalNewProject = [newProject, project]; // Add accessor for global mousemove handler.

	newProject.addEventListener('mousedown', function() {
		project.move = true;
	}, false);

	newProject.addEventListener('mouseup', function() { // XXX: If mouse is not on div this does not work.
		project.move = false;

		if (feasibleProject(project)) {
			projects.push(project);
			globalNewProject = undefined;
			draw();
		} else {
			newProject.classList.add('flash');

			setTimeout(function() {
				newProject.classList.remove('flash'); // Remove flash once animation is done.
				// XXX: Perhaps play animation with JS, not CSS class.
			}, 1000);
		}
	}, false);

	return [newProject, project];
}

function createProjectDiv(project) {
	var projectWidth = fullDayWidth;
	var projectHeight = project.size*workUnitHeight;

	var projectDiv = document.createElement('div');

	projectDiv.classList.add('project');
	projectDiv.id += 'project-' + project.id;

	projectDiv.style.backgroundColor = project.color;
	projectDiv.style.opacity = 0.6;
	projectDiv.style.width = projectWidth + 'px';
	projectDiv.style.height = projectHeight + 'px';

	var innerContent = document.createElement('p');

	innerContent.innerHTML = 	['<span class=name>', project.name, '</span>',
								'<br> Deadline: <span class=deadline>', project.deadline, '</span>',
								'<br> Size: <span class=size>', project.size, '</span>'].join(' ');

	projectDiv.appendChild(innerContent);

	return projectDiv;
}

function draw() {
	fullDayWidth = screenWidth/daysPerPage;

	drawDays();

	// scheduledProjects = 0; // Reset scheduled projects.
	// document.getElementById('projects').innerHTML = ''; // Empty created projects.
	// forEach(projects, calcProjectVars);
}

function newProjectDialog() {
	var dialog = document.getElementById('dialog');
	dialog.style.display = 'block';
	dialog.style.top = screenHeight/2 - dialog.clientHeight/2 + 'px';
	dialog.style.left = screenWidth/2 - dialog.clientWidth/2 + 'px';
}



// Old code that will probs never be used:
	// document.getElementById('new-project').addEventListener('click', function(){
	// 	dialog.style.display = 'block';
	// }, false);

	// document.getElementById('new-project-create').addEventListener('click', function(e) {
	// 	var dialog = document.querySelector('#dialog');
	// 	var name = dialog.querySelector('.name');
	// 	var deadline = dialog.querySelector('.deadline');
	// 	var size = dialog.querySelector('.size');
	// 	var color = dialog.querySelector('.color');

	// 	projects.push({
	// 		'name': name.value,
	// 		'deadline': Number(deadline.value),
	// 		'size': Number(size.value),
	// 		'color': color.value
	// 	});

	// 	// Reset values;
	// 	name.value = '';
	// 	deadline.value = '';
	// 	size.value = '';
	// 	color.value = '';
	// 	dialog.style.display = 'none';

	// 	draw();
	// }, false);


		// var prevChange = dayNo - clicked.current; // Change since last update.
		// var futureStart = clicked.project.firstWork() + prevChange;
		// var futureEnd = futureStart + clicked.project.dayLoadLength() - 1; // futureStart + dayLoadLength() includes firstWork day twice.

		// assert(futureStart <= futureEnd);

		// if (dayNo >= futureEnd) { // User wants to change project end; increase.
		// 	futureEnd = dayNo + 1;
		// }

		// console.log(futureStart, futureEnd, clicked.project.start());

		// if (!clicked.ctrl && futureStart < clicked.project.start()) { // Moving to the left of start is not allowed w/o ctrl.
		// 	return;
		// }

		// if (!clicked.ctrl && futureEnd > clicked.project.end()) { // Moving past deadline is not allowed w/o ctrl.
		// 	// console.log(futureEnd);
		// 	return;
		// }

		// // console.log('firstWork   ', clicked.project.firstWork());
		// // console.log('dayNo       ', dayNo);
		// // console.log('fStart      ', futureStart);
		// // console.log('fEnd        ', futureEnd);
		// // console.log('Cur         ', clicked.current);
		// // console.log('Prev        ', clicked.previous);
		// // console.log('Cur-Prev    ', clicked.current - clicked.previous);
		// // console.log('projectStart', clicked.project.start());
		// // console.log('projectEnd  ', clicked.project.end());
		// // console.log('--------------------------------------------');

		// clicked.previous = clicked.current;
		// clicked.current = dayNo;
		// clicked.project.updateDayLoad();
		// // console.log('Drawing..');
		// draw();
