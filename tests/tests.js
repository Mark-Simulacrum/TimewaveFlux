var test = require('tape');
require('../src/scripts/helpers/pollyfill');

var dateHelpers = require('../src/scripts/helpers/date-helpers');

function testTimeToWork(t, string, expectedWorkAmount, message) {
	var workAmountResult = dateHelpers.timeToWork(string);

	t.equal(workAmountResult, expectedWorkAmount, message || '');
}

test('Hour Time Conversion', function (t) {
	t.plan(2);

	testTimeToWork(t, '1h', 60, 'Positive time');
	testTimeToWork(t, '-1h', -60, 'Negative time');
});

test('Minute Time Conversion', function (t) {
	t.plan(2);

	testTimeToWork(t, '1m', 1, 'Positive time');
	testTimeToWork(t, '-1m', -1, 'Negative time');
});

test('Hour and Minute Time Conversion', function (t) {
	t.plan(3);

	testTimeToWork(t, '1h1m', 61, 'Both Positive');
	testTimeToWork(t, '-1h-1m', -61, 'Both Negative');
	testTimeToWork(t, '-1h1m', -61, 'Minus operator in front should apply to both minutes and hours');
});

test('Incorrect input conversion', function (t) {
	t.plan(4);

	testTimeToWork(t, '', 0, 'Blank input');
	testTimeToWork(t, 'fh', 0, 'Non number hours');
	testTimeToWork(t, 'fhdm', 0, 'Non number hours & minutes');
	testTimeToWork(t, '-h-m', 0, 'Negative symbol without numbers');
});

test('Pollyfills', function (t) {
	require('../src/scripts/helpers/pollyfill');

	t.ok('test'.contains('test'), 'Check string containing string');
	t.notOk('te st'.contains('test'), 'Check that strings with spaces do not match.');

	t.ok([1, 0, 1].contains(1), 'Check simple contains in array.');
	t.notOk([{
		val: 1
	}].contains({
		val: 2
	}), 'See if contains fails on objects.');

	t.deepEqual([0, 1, 0].trim(0), [1], 'Test trimming of 0s from array.');
	t.deepEqual([0, 1, 0, 1, 0].trim(0), [1, 0, 1], 'Test internal zero in array.');

	t.end();
});
