"use strict";
var projects = [
	new Project({
		name: 'Project #1',
		deadline: 1,
		color: 'lightblue',
		dayLoad: [10],
		customer: 'Happy Joe'
	}),
	new Project({
		name: 'Project #2',
		color: '#BADA55',
		deadline: 1,
		dayLoad: [25]
	}),
	new Project({
		name: 'Project #3',
		deadline: 3,
		color: 'cyan',
		dayLoad: [15, 20]
	}),
	new Project({
		name: 'Project #4',
		deadline: 5,
		color: 'rgba(0,0,0,0.2)',
		dayLoad: [30, 0, 20, 45]
	}),
	new Project({
		name: 'Project #5',
		deadline: 10,
		color: '#BADA55',
		dayLoad: [0, 0, 60*7, 0, 30, 0, 0],
		customer: 'Happy Joe'
	})
];



