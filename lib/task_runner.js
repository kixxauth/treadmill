'use strict';

var Immutable = require('immutable');
var filepath = require('filepath');

var Task = require('./task');

function TaskRunner() {
	Object.defineProperties(this, {
		tasks: {
			enumerable: true,
			value: Object.create(null)
		}
	});
}

module.exports = TaskRunner;

TaskRunner.prototype.task = function (taskName, dependencies, handler) {
	if (typeof dependencies === 'function') {
		handler = dependencies;
		dependencies = [];
	}
	this.tasks[taskName] = Task.create({
		name: taskName,
		handler: handler,
		dependencies: dependencies,
		parent: this
	});
	return this;
};

TaskRunner.prototype.getTask = function (taskName) {
	return this.tasks[taskName];
};

TaskRunner.prototype.run = function (taskName, args) {
	var task = this.tasks[taskName];

	if (!task) {
		throw new Error('No task defined as "' + taskName + '"');
	}

	args.currentWorkingDirectory = filepath.create();

	return task.run(new Immutable.Map(args));
};

TaskRunner.create = function () {
	return new TaskRunner();
};
