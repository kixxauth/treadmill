var PROC = require('child_process')
  , PATH = require('path')

  , assert = require('assert')

  , baseDir = PATH.dirname(__dirname)
  , binDir = PATH.join(baseDir, 'bin')


function runTest(dir, callback) {
    var cmd = PATH.join(binDir, 'treadmill') +' '+ PATH.join(__dirname, dir);
    PROC.exec(cmd, function (err, stdout, stderr) {
        return callback(err, stdout.toString(), stderr.toString());
    });
}


var runner = (function () {
    var self = {}
      , stack = []

    self.addTest = function (name, test) {
        stack.push(function (callback) {
            runTest(name, function (err, stdout, stderr) {
                test(stdout, stderr, err);
                return callback();
            });
        });
    };

    self.run = function (callback) {
        stack.reverse().forEach(function (next) {
            var child = callback;
            callback = function () {
                next(child);
            };
        });

        callback();
        return self;
    };

    return self;
}());


runner.addTest('full-tests', function (stdout, stderr, err) {
    if (err) {
        console.error('Treadmill error while test Treadmill:');
        console.error('STDOUT', stdout);
        console.error('STDERR', stderr);
        process.exit(2);
    }

    console.log('STDOUT', stdout);
    console.log('STDERR', stderr);
    console.log('ERR', err);
});

runner.addTest('syntax-error', function (stdout, stderr, err) {
    var g = /There was a SyntaxError in the test file/.test(stderr)
    assert.ok(g, 'SyntaxError message');
    assert.equal(err.code, 2, 'error code');
});

runner.addTest('file-error', function (stdout, stderr, err) {
    var g = /There was an Error thrown in the test file/.test(stderr)
    assert.ok(g, 'file Error message');
    assert.equal(err.code, 2, 'error code');
});

runner.addTest('group-error', function (stdout, stderr, err) {
    var g = /There was an Error thrown in the group 'ErrorThrower'/.test(stderr)
    assert.ok(g, 'group Error message');
    assert.equal(err.code, 2, 'error code');
});


runner.run(function () {
    console.log('Tests Complete :)');
});
