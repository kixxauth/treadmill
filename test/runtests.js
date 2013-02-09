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


runner.addTest('syntax-error', function (stdout, stderr, err) {
    var g = /There was a SyntaxError in the test file/.test(stderr)
    assert.ok(g, 'SyntaxError message');
});

runner.addTest('file-error', function (stdout, stderr, err) {
    var g = /There was an Error thrown in the test file/.test(stderr)
    assert.ok(g, 'file Error message');
});


runner.run(function () {
    console.log('Tests Complete :)');
});
