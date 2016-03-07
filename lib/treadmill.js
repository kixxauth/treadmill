'use strict';

var logger = require('./logger');
var TaskRunner = require('./task_runner');
var taskRunner = TaskRunner.create();

module.exports = {
	task: function () {
		return taskRunner.task.apply(taskRunner, arguments);
	},

	logger: logger.create(' - '),

	run: function (taskName) {
		return taskRunner
			.run(taskName)
			.catch(function (err) {
				console.error('Treadmill run aborted with an Error:');
				console.error(err.stack || err.message || err);
				process.exit(1);
			});
	}
};
