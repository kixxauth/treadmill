'use strict';

var logger = require('./logger');

function Task(spec) {
	Object.defineProperties(this, {
		name: {
			enumerable: true,
			value: spec.name
		},
		handler: {
			value: spec.handler
		},
		dependencies: {
			value: Object.freeze(spec.dependencies)
		},
		parent: {
			value: spec.parent
		},
		log: {
			value: logger.create('Task ' + spec.name)
		}
	});
}

module.exports = Task;

Task.prototype.run = function (args) {
	if (args.has(this.name)) {
		return args;
	}

	this.log('start');

	var self = this;

	var dependencies = this.dependencies.map(function (taskName) {
		var task = self.parent.getTask(taskName);
		if (!task) {
			throw new Error('No dependency task defined as "' + taskName + '"');
		}
		return task;
	});

	var promise = Promise.resolve(args);

	if (dependencies.length) {
		promise = dependencies.reduce(function (promise, task) {
			return promise.then(function (args) {
				return task.run(args);
			});
		}, promise);
	}

	var taskName = this.name;
	var handler = this.handler;

	return promise.then(function (args) {
		var promise;

		// If arity is < 2 there is no callback supplied and we'll be
		// expecting a Promise.
		if (handler.length < 2) {
			promise = handler(args);

			if (promise && typeof promise.then === 'function') {
				return promise.then(function (result) {
					self.log('complete via Promise');
					return args.set(taskName, result);
				}, function (err) {
					self.log('rejected with an Error');
					return Promise.reject(err);
				});
			}

			return Promise.reject(new Error('Task function without callback must return a Promise'));
		}

		// If arity is 2 or more then we expect the task to conclude via
		// a callback function.
		return new Promise(function (resolve, reject) {
			try {
				handler(args, function (err, result) {
					if (err) {
						self.log('Error passed to callback');
						return reject(err);
					}

					self.log('complete via callback');
					resolve(args.set(taskName, result));
				});
			} catch (err) {
				self.log('threw an Error');
				return reject(err);
			}
		});
	});
};

Task.create = function (spec) {
	return new Task(spec);
};
