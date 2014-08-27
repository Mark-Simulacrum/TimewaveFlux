var test = require('tape');

var printf = require('printf');

require('../helpers/pollyfill');
var dateHelpers = require('../helpers/date-helpers');

function random(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

function testTimeToWork(t, string, expectedWorkAmount, message) {
	var workAmountResult = dateHelpers.timeToWork(string);

	var str = message !== undefined ?
		printf('%s -> `%s` to work ; got `%s` ; expected `%s`.', message, string, workAmountResult, expectedWorkAmount) : printf('`%s` to work ; got `%s` ; expected `%s`.', string, workAmountResult, expectedWorkAmount);

	t.ok(workAmountResult === expectedWorkAmount, str);
}

var testAmount = 500;
var randomSize = 10000;

test('Hour Time Conversion', function (t) {
	for (var i = 0; i < testAmount; i++) {

		var hours = random(-randomSize, randomSize);

		var string = (hours < 0 ? '-' : '') + hours + 'h';

		testTimeToWork(t, string, hours * 60);
	}

	t.end();
});

test('Minute Time Conversion', function (t) {
	for (var i = 0; i < testAmount; i++) {

		var minutes = random(-randomSize, randomSize);

		var string = (minutes < 0 ? '-' : '') + minutes + 'm';

		testTimeToWork(t, string, minutes);
	}

	t.end();
});

test('Hour and Minute Time Conversion', function (t) {
	for (var i = 0; i < testAmount; i++) {

		var hours = random(-randomSize, randomSize);
		var minutes = random(-randomSize, randomSize);

		var string = (hours < 0 ? '-' : '') + hours + 'h' + minutes + 'm';

		testTimeToWork(t, string, hours * 60 + minutes);
	}

	t.end();
});

test('Incorrect input conversion', function (t) {
	testTimeToWork(t, '', 0, 'Blank input');
	testTimeToWork(t, 'fh', 0, 'Non number hours');
	testTimeToWork(t, 'fhdm', 0, 'Non number hours & minutes');
	testTimeToWork(t, '-h-m', 0, 'Negative symbol without numbers');


	for (var i = 0; i < testAmount; i++) {
		var amount = random(-randomSize, randomSize);
		testTimeToWork(t, String(amount), (amount - amount % 60) / 60 + amount % 60, 'No identifiers.');
	}

	t.end();
});

test('Pollyfills', function (t) {
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
