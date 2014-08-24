require('./pollyfill');
require('./footer');

require('./projects').loadWork();

require('./project-canvas-draw').draw();
require('./dateline').draw();

require('./project-canvas').init();

require('./event-listeners').add();

var dayHelpers = require('./day-helpers');
var globals = require('./globals');
dayHelpers.updateDaysPerPage(globals.daysPerPage());
dayHelpers.updateFirstDay(globals.firstDay());
