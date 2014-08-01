	var rgbRand = hexToRgb('#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)); // XXX: Pick a color


	ctx.fillRect(getDayStart(dayNo+1), 0, dayBorder/2, window.innerHeight); // Border right (half)
	
	// ctx.fillStyle = 'rgba(' + rgbRand.r + ',' +rgbRand.g + ',' + rgbRand.b+ ', 1.4)';
	// ctx.fillRect(getDayStart(dayNo), 100, dayWidth, window.innerHeight)

	// ctx.fillRect(dayNo*dayWidth, 0, dayWidth-dayBorder, window.innerHeight);
