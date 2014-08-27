if (!Array.prototype.contains) {
	Array.prototype.contains = function (needle) {
		return this.indexOf(needle) !== -1;
	};
}

// Credit: MDN @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains
String.prototype.contains = function () {
	return String.prototype.indexOf.apply(this, arguments) !== -1;
};

Array.prototype.trim = function (value) {
	var array = this.slice(0); // Don't modify this, return new array.

	while (array.length > 0 && array[0] === value) {
		array.shift();
	}

	while (array.length > 0 && array[array.length - 1] === value) {
		array.pop();
	}

	return array;
};
