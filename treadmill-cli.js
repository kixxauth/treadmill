'use strict';

var yargs = require('yargs');
var filepath = require('filepath');
var treadmill = require('./lib/treadmill');

exports.main = function () {
	var options = yargs
		.usage('Usage: $0 <script_path> [task_name]')
		.help();

	var argv = options.argv;
	var script = argv._[0];
	var task = argv._[1];

	if (!script) {
		console.log('Missing first <script_path> argument.');
		options.showHelp();
		process.exit(1); // eslint-disable-line xo/no-process-exit
	}
	if (!task) {
		console.log('Missing second <task_name> argument.');
		options.showHelp();
		process.exit(1); // eslint-disable-line xo/no-process-exit
	}

	return exports.run(script, task);
};

exports.run = function (script, task) {
	require(filepath.create(script).toString());
	return treadmill.run(task);
};

if (require.main === module) {
	exports.main();
}
