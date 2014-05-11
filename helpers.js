"use strict";

// General Helpers

function dayLoad(dayNo) {
	var dayLoad = 0;

	for (var i = 0; i < scheduledProjects; i++) {
		var project = projects[i];
		if (project.start() <= dayNo && dayNo < project.end()) {
			dayLoad += project.load(dayNo - project.start());
		}
	}

	return dayLoad;
}

function leftBorder(dayNo) {
	return (dayNo - firstDay)*fullDayWidth;
}

function dayStart(dayNo) {
	return leftBorder(dayNo) + borderWidth;
}

function dayWidth() {
	return fullDayWidth - borderWidth;
}

function getDay(offsetLeft) {
	var day = Math.floor(offsetLeft/fullDayWidth) + firstDay;
	if (day < 0) day = 0;
	return day;
}

function dateText(dayNo) {
	return 'Day: ' + dayNo;
}

// Canvas helpers

function multilineText(text, x, y, maxWidth) {
	var textArray = text.split('\n');
	var height = MeasureText(textArray[0], false, 'Arial', 12)[1]; // Get height of text.
	
	ctx.fillStyle = 'black';
	ctx.textAlign = 'center';
	ctx.font = 'Arial 12pt';

	for (var i = 0; i < textArray.length; i++) {
		var line = textArray[i];
		ctx.fillText(line, x, y + height*(i + 1), maxWidth); // (i + 1) so that we start with the height added.
	};
}

function getProjectByCoordinates(x, y) {
	var dayNo = getDay(x);
	var foundProjects = getProjects(dayNo);
	for (var i = foundProjects.length - 1; i >= 0; i--) {
		var project = foundProjects[i];
		var relativeDayNo = project.relativeDayNo(dayNo);

		if (project.y[relativeDayNo] < y && y < project.maxY(dayNo)) {
			return project;
		}
	};

	return false;
}

// Project Helpers

function calcProjectVars(project, index) {
	++scheduledProjects;
}

function getProjects(dayNo) {
	var foundProjects = [];

	for (var i = 0; i < scheduledProjects; i++) {
		var project = projects[i];
		if (project.start() <= dayNo && dayNo < project.end()) { // project.end == project.deadline + 1
			foundProjects.push(project);
		}
	}

	return foundProjects;
}

// Event Helpers

function onScrollbarInput() {
	firstDay = Number(scrollbar.value);
	firstDayBox.value = firstDay;

	draw();
}

function onFirstDayChange() {
	firstDay = Number(firstDayBox.value);
	scrollbar.value = firstDay;
	
	draw();
}

function onDaysPageChange() {
	daysPerPage = Number(days_page.value);

	scrollbar.max = dayCount - daysPerPage;
	firstDayBox.max = dayCount - daysPerPage;
	fullDayWidth = screenWidth/daysPerPage;

	draw();
}

function onResizeWindow() {
	screenWidth = window.innerWidth;
	screenHeight = htmlBody.clientHeight;
	
	canvas.width = screenWidth;
	canvas.height = screenHeight - footerSize;

	scrollbar.style.width = Math.floor(screenWidth/2) + 'px';
	scrollbar.style.left = Math.floor(screenWidth/2 - scrollbar.clientWidth/2) + 'px';

	fullDayWidth = screenWidth/daysPerPage;

	draw();
}


// Third-party functions

/**
* Work attributed to: http://www.rgraph.net/blog/2013/january/measuring-text-height-with-html5-canvas.html; Richard Heyes
* Measures text by creating a DIV in the document and adding the relevant text to it.
* Then checking the .offsetWidth and .offsetHeight. Because adding elements to the DOM is not particularly
* efficient in animations (particularly) it caches the measured text width/height.
* 
* @param  string text   The text to measure
* @param  bool   bold   Whether the text is bold or not
* @param  string font   The font to use
* @param  size   number The size of the text (in pts)
* @return array         A two element array of the width and height of the text
*/
function MeasureText(text, bold, font, size)
{
    // This global variable is used to cache repeated calls with the same arguments
    var str = text + ':' + bold + ':' + font + ':' + size;
    if (typeof(__measuretext_cache__) == 'object' && __measuretext_cache__[str]) {
        return __measuretext_cache__[str];
    }

    var div = document.createElement('DIV');
        div.innerHTML = text;
        div.style.position = 'absolute';
        div.style.top = '-100px';
        div.style.left = '-100px';
        div.style.fontFamily = font;
        div.style.fontWeight = bold ? 'bold' : 'normal';
        div.style.fontSize = size + 'pt';
    document.body.appendChild(div);
    
    var size = [div.offsetWidth, div.offsetHeight];

    document.body.removeChild(div);
    
    // Add the sizes to the cache as adding DOM elements is costly and can cause slow downs
    if (typeof(__measuretext_cache__) != 'object') {
        __measuretext_cache__ = [];
    }
    __measuretext_cache__[str] = size;
    
    return size;
}

/** // Chris Coyier, CSS TRICKS, http://css-tricks.com/snippets/javascript/javascript-array-contains/
 * Array.prototype.[method name] allows you to define/overwrite an objects method
 * needle is the item you are searching for
 * this is a special variable that refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */
Array.prototype.contains = function ( needle ) {
// for (var i in this) {
//     if (this[i] === needle) return true;
// }
// return false;

return this.indexOf(needle) >= 0;
}

Array.prototype.trimZeros = function () {
	var array = this.slice(0); // Don't modify this, return new array.
	while (array.length > 0 && array[0] == 0) {
		array.shift();
	}
	while (array.length > 0 && array[array.length - 1] == 0) {
		array.pop();
	}
	return array;
}