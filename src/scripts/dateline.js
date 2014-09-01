var globals = require('./globals');
var dateHelpers = require('./helpers/date-helpers');
var dayHelpers = require('./helpers/day-helpers');

var headerCtx = globals.headerCtx;
var borderWidth = globals.borderWidth;

var dateline = {
	height: 30,

	month: {
		amount: 6,
		format: 'MMM',
		color: 'blue',
		modifier: 1
	},

	week: {
		amount: 2,
		format: '[w]w',
		color: 'red',
		modifier: 0.75
	},

	day: {
		amount: 3,
		format: 'ddd',
		color: '#00b100',
		modifier: 0.5
	},

	dots: [],

	get dotSize() {
		return Math.floor(headerCtx.canvas.clientHeight / 4);
	},
	get dotY() {
		return Math.floor(dateline.dotSize * 1.5);
	},
	get interval() {
		return window.innerWidth / dateline.totalDots;
	},
	get centerX() {
		return window.innerWidth / 2;
	}
};

dateline.totalDots = (dateline.month.amount + dateline.week.amount + dateline.day.amount) * 2;
dateline.midPoint = Math.floor(dateline.totalDots / 2);

global.dateline = dateline;

function drawDot(dotNumber, side) {
	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;

	var dot = dateline.dots[sidedDotNumber];
	var dotTypeData = dateline[dot.type];

	headerCtx.beginPath();
	headerCtx.fillStyle = dotTypeData.color;
	headerCtx.arc(dot.x, dateline.dotY, dateline.dotSize * dotTypeData.modifier, 0, Math.PI * 2);
	headerCtx.closePath();
	headerCtx.fill();

	headerCtx.fillStyle = 'black';
	headerCtx.textAlign = 'center';
	headerCtx.textBaseline = 'middle';
	headerCtx.fillText(dot.text, dot.x, dateline.dotY + dateline.dotSize * 2);
}

function calculatePoint(dotNumber, side) {
	var dotType = '';
	var dayDelta;

	if (dotNumber < dateline.month.amount) {

		dotType = 'month';
		dayDelta = side * (dateline.month.amount - dotNumber);

	} else if (dotNumber < dateline.month.amount + dateline.week.amount) {

		dotType = 'week';
		dayDelta = side * (dateline.month.amount + dateline.week.amount - dotNumber);

	} else if (dotNumber < dateline.month.amount + dateline.week.amount + dateline.day.amount) {

		dotType = 'day';
		dayDelta = side * (dateline.month.amount + dateline.week.amount + dateline.day.amount - dotNumber);

	}

	var currentDay = globals.firstDay() + Math.floor(globals.daysPerPage() / 2);
	var currentMoment = dateHelpers.toMoment(currentDay);
	var dotMoment = currentMoment.clone().add(dayDelta, dotType);

	var sidedDotNumber = side < 0 ? dotNumber : dotNumber + dateline.midPoint;
	var x = dateline.interval / 2 + ((dateline.interval) * dotNumber);

	x = side < 0 ? x : dateline.centerX * 2 - x; // Correct x for right sides.

	dateline.dots[sidedDotNumber] = {
		areas: [x - dateline.interval / 2, x + dateline.interval / 2],
		x: x,
		type: dotType,
		text: dotMoment.format(dateline[dotType].format),
		dayDifference: dotMoment.diff(currentMoment, 'days')
	};
}

function getDatelineDot(x) {
	for (var i = 0; i < dateline.dots.length; i++) {
		var dot = dateline.dots[i];
		if (dot.areas[0] < x && x < dot.areas[1]) {
			var distanceFromDot = 0;

			if (x < dot.x - dateline.dotSize) {
				distanceFromDot = dot.x - dateline.dotSize - x;
			} else if (x > dot.x + dateline.dotSize) {
				distanceFromDot = dot.x + dateline.dotSize - x;
			}

			return {
				dot: dot,
				distanceFromDot: Math.floor(distanceFromDot)
			};
		}
	}
	return null;
}

function draw() {
	headerCtx.canvas.width = window.innerWidth;
	headerCtx.canvas.height = dateline.height;

	headerCtx.clearRect(0, 0, headerCtx.canvas.clientWidth, headerCtx.canvas.clientHeight);

	headerCtx.fillStyle = 'black';
	var lineLength = dateline.centerX - dateline.interval / 2;
	headerCtx.fillRect(0, dateline.dotY, lineLength, borderWidth);
	headerCtx.fillRect(dateline.centerX + dateline.interval / 2, dateline.dotY, lineLength, borderWidth);

	for (var dotNumber = 0; dotNumber < dateline.midPoint; dotNumber++) // To the left
	{
		calculatePoint(dotNumber, -1);
		calculatePoint(dotNumber, +1);

		drawDot(dotNumber, -1);
		drawDot(dotNumber, +1);
	}
}

function getDayDifference(x) {
	var clickedData = getDatelineDot(x);
	if (clickedData) {
		var multiplier;

		if (clickedData.distanceFromDot === 0 || clickedData.dot.type == 'day') {
			multiplier = 0;
		} else if (clickedData.dot.type == 'week') {
			multiplier = 7;
		} else if (clickedData.dot.type == 'month') {
			multiplier = 10;
		}

		return clickedData.dot.dayDifference + (Math.round(clickedData.distanceFromDot * multiplier / dateline.interval) * - 1);
	}

	return 0; // Return 0 by default
}

headerCtx.canvas.addEventListener('mousemove', function (event) {
	headerCtx.clearRect(dateline.centerX - dateline.interval / 4, 0, dateline.interval / 2, headerCtx.canvas.clientHeight);
	headerCtx.fillText(getDayDifference(event.x), dateline.centerX, headerCtx.canvas.clientHeight / 2, dateline.interval / 2);
});

headerCtx.canvas.addEventListener('mouseleave', function () {
	headerCtx.clearRect(dateline.centerX - dateline.interval / 4, 0, dateline.interval / 2, headerCtx.canvas.clientHeight);
});

headerCtx.canvas.addEventListener('click', function (event) {
	dayHelpers.updateFirstDay(globals.firstDay() + getDayDifference(event.x));
}, false);

window.addEventListener('resize', draw);

module.exports.draw = draw;
