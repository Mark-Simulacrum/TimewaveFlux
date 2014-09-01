module.exports.headerCtx = document.getElementById('header-canvas').getContext('2d');
module.exports.footer = document.getElementsByTagName('footer')[0];

var _firstDay = 0;
function firstDay(newValue) {
	if (typeof newValue !== 'undefined' && !isNaN(newValue)) {
		_firstDay = newValue;
	}
	return _firstDay;
}

module.exports.firstDay = firstDay;

var _daysPerPage = 14;
function daysPerPage(newValue) {
	if (typeof newValue !== 'undefined' && !isNaN(newValue)) {
		_daysPerPage = newValue;
	}
	return _daysPerPage;
}

module.exports.daysPerPage = daysPerPage;

module.exports.now = (require('./helpers/date-helpers')).fromTodayToDay();

module.exports.now = firstDay();
module.exports.daySize = 8 * 60;
module.exports.dayCount = 365 * 200;

module.exports.fullDayWidth = function () {
	return window.innerWidth / daysPerPage();
};

module.exports.dayTitleHeight = 25;
module.exports.fontStack = '14px Arial';
module.exports.minimumWork = 20;
module.exports.workUnitHeight = 1;

module.exports.borderWidth = 1;

module.exports.debug = function () {
	return window.location.hash.contains('debug');
};
