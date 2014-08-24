module.exports = function (x, y, text) {
	var element = document.querySelector('#tooltip');
	if (typeof text === 'undefined' || text === null) {
		element.style.display = 'none';
		return;
	}

	element.innerHTML = text;
	element.style.left = x + 'px';
	element.style.top = y + 'px';
	element.style.display = 'inline-block';
};
