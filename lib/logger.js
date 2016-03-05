'use strict';

exports.create = function (prefix) {
	return function (message) {
		return console.log('%s: %s', prefix, message);
	};
};
