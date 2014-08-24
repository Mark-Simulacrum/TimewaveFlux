require('./helpers/pollyfill');
require('./footer');

require('./helpers/project-helpers').loadWork();

require('./project-canvas-draw').draw();
require('./dateline').draw();

require('./helpers/project-canvas-helpers').init();

require('./event-listeners').add();

var dayHelpers = require('./helpers/day-helpers');
var globals = require('./globals');
dayHelpers.updateDaysPerPage(globals.daysPerPage());
dayHelpers.updateFirstDay(globals.firstDay());
