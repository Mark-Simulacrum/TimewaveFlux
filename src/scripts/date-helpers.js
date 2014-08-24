var moment = require('moment');

var calendarFormat = 'YYYY/MM/DD';
var calendarStart = '2014/08/01';

function toMoment(dayNo)
{
	return moment(calendarStart, calendarFormat).add(dayNo, 'day').startOf('day');
}

module.exports.toMoment = toMoment;

function fromMomentToDay(moment)
{
	return moment.startOf('day').diff(toMoment(0), 'days'); // startOf('day') is necessary, otherwise halfdays and other weird rounds happen
}

module.exports.fromMomentToDay = fromMomentToDay;

function fromMomentToDate(moment)
{
	return moment.format(calendarFormat);
}

module.exports.fromMomentToDate = fromMomentToDate;

function fromDayToString(dayNo)
{
	return fromMomentToDate(toMoment(dayNo));
}

module.exports.fromDayToString = fromDayToString;

function fromDateToDay(date)
{
	return fromMomentToDay(moment(date, calendarFormat));
}

module.exports.fromDateToDay = fromDateToDay;

function fromDateToMoment(date)
{
	return moment(date, calendarFormat);
}

module.exports.fromDateToMoment = fromDateToMoment;

module.exports.fromTodayToDay = function () {
	return fromMomentToDay(moment());
};

function dateText(dayNo, fullDate)
{
	var date = toMoment(dayNo).date() + '';
	var yearDate = '\n' + toMoment(dayNo).format(calendarFormat); // For now, default to day 0 being now (as in, today in real time)
	if (fullDate)
	{
		return yearDate;
	}
	else
	{
		return date;
	}
}

module.exports.dateText = dateText;

function workToTime(workUnits)
{
	var isNegative = workUnits < 0 ? '-' : '';
	var minutes = workUnits % 60;
	var hours = (workUnits - minutes) / 60;

	minutes = minutes > 0 ? minutes + 'min' : ''; // Convert number to string
	hours = hours > 0 ? hours + 'h' : ''; // Convert number to string
	if (!hours && !minutes) return '0';


	return isNegative + hours + minutes;
}

module.exports.workToTime = workToTime;

function timeToWork(string)
{
	var hours = 0,
		minutes = 0;

	var negative = string.match(/^-/) ? -1 : 1;

	if (string.contains('h'))
	{
		hours += Number(string.match(/(\d+)h/)[1]);
	}

	if (string.contains('m'))
	{
		var newMinutes = Number(string.match(/(\d+)m/)[1]);
		minutes += newMinutes;
	}
	else if (!string.contains('h'))
	{ // If string does not contain minutes or hours
		if (Number(string) >= 15)
		{
			minutes += Number(string);
		}
		else
		{
			hours += Number(string);
		}
	}

	// \d matches negative signs, we don't really want that since we have our own handling for negatives.
	if (hours < 0) hours = -hours;
	if (minutes < 0) minutes = -minutes;

	return negative * (hours * 60 + minutes);
}

module.exports.timeToWork = timeToWork;

module.exports.calendar = {
	format: calendarFormat,
	start: calendarStart
};
