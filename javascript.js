var divs = [];
var mouse = {x: 0, y: 0};
var moveDiv = false;

function updateDivs() {
	divs.forEach(function(element) {
		if (element["move"]) {
			element["div"].style.top = (mouse.y - element["div"].clientHeight/2) + 'px'; // Subtract height/2 to move by center
			element["div"].style.left = (mouse.x - element["div"].clientWidth/2) + 'px';
		}
	});
}

// XXX: Find a way to change this mess of Array.proto.slice... to something nicer.
Array.prototype.slice.call(document.querySelectorAll("div")).forEach(
	function addDiv(value) {
		var div = {
			div: value,
			move: false
		}
		
		div["div"].addEventListener('mousedown', function(e) {
			div["move"] = true;
		}, false);

		div["div"].addEventListener('mouseup', function(e) {
			div["move"] = false;
		}, false);

		divs.push(div);
	}
);

document.addEventListener('mousemove', function(e){ 
	mouse.x = e.clientX || e.pageX; 
	mouse.y = e.clientY || e.pageY;

	updateDivs();
}, false);
