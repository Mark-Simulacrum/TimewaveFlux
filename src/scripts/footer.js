var projectCanvas = require('./project-canvas');
var dateHelpers = require('./date-helpers');

var workToTime = dateHelpers.workToTime;
var dateText = dateHelpers.dateText;
var now = require('./globals').now;

var footer = document.querySelector('footer');

projectCanvas.eventEmitter.addListener('selectedProjectChanged', function (selectedProject) {
	var projectElement = document.querySelector('footer .project');
	if (selectedProject === null) {
		projectElement.style.visibility = 'hidden';
		return;
	}

	var project = selectedProject.project;

	document.getElementById('workInput').value = ''; // Taken direct from clear, mostly b/c we don't want to hide and unhide an element.

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
	document.getElementById('customer_name').innerHTML = project.customerName;
	document.getElementById('start').value = dateText(project.start(), true);
	document.getElementById('deadline').value = dateText(project.deadline, true);
	document.getElementById('days').innerHTML = daysBeforeNow + '/' + project.dayLoad.length; // Add 1 to now b/c now includes now.
	document.getElementById('hours').innerHTML = workToTime(project.workDone) + ' / ' + workToTime(project.size());
	document.getElementById('workInDayClicked').innerHTML = workToTime(project.load(selectedProject.dayClicked));
}, false);


module.exports.notify = function (message)
{
	var notificationsElement = footer.querySelector('.notifications-list');

	if (notificationsElement.lastElementChild && notificationsElement.lastElementChild.innerHTML == message)
	{
		var messageCount = notificationsElement.lastElementChild.getAttribute('data-messageCount');
		if (messageCount === null)
		{
			messageCount = '1';
		}
		messageCount = messageCount.replace(/\d+/, function (num)
		{
			return ++num;
		});
		notificationsElement.lastElementChild.setAttribute('data-messageCount', messageCount);
	}
	else
	{
		var notification = document.createElement('p');
		notification.innerHTML = message;
		notification.classList.add('notification');
		notificationsElement.appendChild(notification);
	}

	if (notificationsElement.childNodes.length == 1000)
	{
		notificationsElement.removeChild(notificationsElement.childNodes[0]);
	}

	notificationsElement.scrollTop = notificationsElement.scrollHeight; // Scroll to bottom
};
