'use strict';

var logger = require('./logger');
var TaskRunner = require('./task-runner');

var taskRunner = TaskRunner.create();

module.exports = {
	task: function () {
		return taskRunner.task.apply(taskRunner, arguments);
	},

	logger: logger.create(' - '),

	run: function (taskName, args) {
		return taskRunner
			.run(taskName, args)
			.catch(function (err) {
				console.error('Treadmill run aborted with an Error:');
				console.error(err.stack || err.message || err);
				process.exit(1); // eslint-disable-line xo/no-process-exit
			});
	}
};
