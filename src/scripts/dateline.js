var globals = require('./globals');
var dateHelpers = require('./helpers/date-helpers');
var dayHelpers = require('./helpers/day-helpers');
var tooltip = require('./tooltip');

var headerCtx = globals.headerCtx;
var borderWidth = globals.borderWidth;

var screenWidth = window.innerWidth;

var dateline = {
	height: 25,
	monthDots: 6,
	monthFormat: 'MMM',
	weekDots: 2,
	weekFormat: '[w]w',
	dayDots: 3,
	dayFormat: 'ddd',
	scaleCanvasWidth: 1,
	dots: [],
	get dotSize() {
		return Math.floor(headerCtx.canvas.clientHeight / 4);
	},
	get dotY() {
		return dateline.dotSize + borderWidth;
	},
	get interval() {
		return (screenWidth * dateline.scaleCanvasWidth) / dateline.sections;
	},
	get startPoint() {
		return (screenWidth - dateline.interval * dateline.sections) / 2;
	}
};

dateline.sections = (dateline.monthDots + dateline.weekDots + dateline.dayDots) * 2;
dateline.midPoint = Math.floor(dateline.sections / 2);

function drawDot(dotNumber, side) {
	var x = dateline.dots[dotNumber].x;

	if (side > 0) {
		x = headerCtx.canvas.width - x;
	}

	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;
	dateline.dots[sidedDotNumber].areas = [x - dateline.interval / 2, x + dateline.interval / 2];
	dateline.dots[sidedDotNumber].x = x;

	headerCtx.beginPath();
	headerCtx.fillStyle = dateline.dots[sidedDotNumber].color;
	headerCtx.arc(x, dateline.dotY, Math.ceil(dateline.dotSize * dateline.dots[sidedDotNumber].modifier), 0, Math.PI * 2);
	headerCtx.closePath();
	headerCtx.fill();

	headerCtx.fillStyle = 'black';
	headerCtx.textAlign = 'center';
	headerCtx.textBaseline = 'middle';
	headerCtx.fillText(dateline.dots[sidedDotNumber].text, x, dateline.dotY + dateline.dotSize * 2);
}

function getCurrentDay() {
	return globals.firstDay + Math.floor(globals.daysPerPage / 2);
}

function calculatePoint(dotNumber, side) {
	var dotModifier = 1;
	var text = '';
	var dotType = '';
	var differenceInDays = 0;
	var color;
	var dayDelta;
	var currentMoment;

	var toMoment = dateHelpers.toMoment;

	var currentDay = getCurrentDay();

	if (dotNumber < dateline.monthDots) {
		color = 'blue';

		dayDelta = side * (dateline.monthDots - dotNumber);
		currentMoment = toMoment(currentDay).add(dayDelta, 'month');
		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');

		text = currentMoment.format(dateline.monthFormat);
		dotType = 'month';
	} else if (dotNumber < dateline.monthDots + dateline.weekDots) {
		color = 'red';
		dotModifier = 0.75;

		dotType = 'week';

		dayDelta = side * (dateline.monthDots + dateline.weekDots - dotNumber);
		currentMoment = toMoment(currentDay).add(dayDelta, 'week');

		text = currentMoment.format(dateline.weekFormat);

		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');
	} else if (dotNumber < dateline.monthDots + dateline.weekDots + dateline.dayDots) {
		color = '#00b100';
		dotModifier = 0.5;

		dotType = 'day';

		dayDelta = side * (dateline.monthDots + dateline.weekDots + dateline.dayDots - dotNumber);
		currentMoment = toMoment(currentDay).add(dayDelta, 'day');

		differenceInDays = currentMoment.diff(toMoment(currentDay), 'days');
		text = currentMoment.format(dateline.dayFormat);
	}

	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;
	dateline.dots[sidedDotNumber] = {
		text: text,
		areas: [null, null], //[x - dateline.interval / 2, x + dateline.interval / 2],
		x: null,
		type: dotType,
		modifier: dotModifier,
		dayDifference: differenceInDays,
		color: color
	};
}

function getDatelineDot(x) {
	for (var i = 0; i < dateline.dots.length; i++) {
		if (dateline.dots[i].areas[0] < x && x < dateline.dots[i].areas[1]) {
			var distanceFromDot = 0;

			if (x < dateline.dots[i].x - dateline.dotSize) {
				distanceFromDot = dateline.dots[i].x - dateline.dotSize - x;
			} else if (x > dateline.dots[i].x + dateline.dotSize) {
				distanceFromDot = dateline.dots[i].x + dateline.dotSize - x;
			}

			return {
				dotNumber: i,
				onDot: distanceFromDot === 0,
				distanceFromDot: Math.floor(distanceFromDot)
			};
		}
	}
	return null;
}

function draw() {
	headerCtx.canvas.width = screenWidth;
	headerCtx.canvas.height = dateline.height;

	headerCtx.clearRect(0, 0, headerCtx.canvas.clientWidth, headerCtx.canvas.clientHeight);

	headerCtx.fillStyle = 'black';
	var datelineCenterX = dateline.startPoint + dateline.interval * dateline.midPoint;
	headerCtx.fillRect(0, dateline.dotY, datelineCenterX - dateline.interval / 2, borderWidth);
	headerCtx.fillRect(datelineCenterX + dateline.interval / 2, dateline.dotY, headerCtx.canvas.clientWidth - datelineCenterX, borderWidth);

	for (var dotNumber = 0; dotNumber < dateline.midPoint; dotNumber++) // To the left
	{
		calculatePoint(dotNumber, -1);
		calculatePoint(dotNumber, +1);
	}

	var x = dateline.startPoint + dateline.interval / 2;

	for (dotNumber = 0; dotNumber < dateline.midPoint; dotNumber++) {
		dateline.dots[dotNumber].x = x;

		drawDot(dotNumber, -1);
		drawDot(dotNumber, +1);

		x += dateline.interval;
	}
}

function getDayDifference(x) {
	var clickedData = getDatelineDot(x);
	if (clickedData) {
		var dotDayDifference = dateline.dots[clickedData.dotNumber].dayDifference;
		if (clickedData.onDot || dateline.dots[clickedData.dotNumber].type == 'day') {
			return dotDayDifference;
		} else {
			if (dateline.dots[clickedData.dotNumber].type == 'week') {
				return dotDayDifference + Math.round(clickedData.distanceFromDot * 7 / dateline.interval * -1);
			} else if (dateline.dots[clickedData.dotNumber].type == 'month') {
				return dotDayDifference + Math.round(clickedData.distanceFromDot * 10 / dateline.interval * -1);
			}
		}
	}

	return 0; // Return 0 by default
}

headerCtx.canvas.addEventListener('mousemove', function (event) {
	tooltip(window.innerWidth / 2,
		dateline.height,
		'Selected change in first day: ' + getDayDifference(event.x));
});

headerCtx.canvas.addEventListener('mouseleave', function () {
	tooltip();
});

headerCtx.canvas.addEventListener('click', function (mouseEvent) {
	dayHelpers.updateFirstDay(globals.firstDay() + getDayDifference(mouseEvent.pageX || mouseEvent.clientX));
}, false);

module.exports.draw = draw;
