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
		return new Promise(function (resolve, reject) {
			var rv;
			try {
				rv = handler(args, function (err, result) {
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

			if (!rv || typeof rv.then !== 'function') {
				rv = Promise.resolve(rv);
			}

			return rv.then(function (result) {
				self.log('complete via Promise');
				resolve(args.set(taskName, result));
			}, function (err) {
				self.log('rejected with an Error');
				reject(err);
			});
		});
	});
};

Task.create = function (spec) {
	return new Task(spec);
};
