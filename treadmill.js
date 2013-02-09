var FS = require('fs')
  , PATH = require('path')

  , OPT = require('optimist')

  , arrayProto = Array.prototype
  , arraySlice = Array.prototype.slice


function uncurry(f) {
    return function () {
        return f.call.apply(f, arguments);
    };
}


function newObject(proto) {
    return Object.create(proto);
}


var slice = uncurry(arraySlice);


function asyncStack(functions) {
    var funcs = arguments.length > 1 ? slice(arguments, 0) : functions
      , callback = funcs.pop()
      , last = callback

    funcs.reverse().forEach(function (fn) {
        var child = callback;
        callback = function () {
            fn(child);
        };
    });
    return callback;
}


function newEventEmitter() {
    var self = newObject(null)
      , handlers = {}

    self.on = function (name, handler) {
        var funcs = handlers[name] || (handlers[name] = [])
        funcs.push(handler);
    };

    self.emit = function (name) {
        var args = slice(arguments, 1)
          , funcs = handlers[name] || []
          , len = funcs.length
          , i = 0

        for (; i < len; i += 1) {
            funcs[i].apply(this, args);
        }
        return this;
    };

    return self;
}


function newGroup(spec) {
    var self = newObject(newEventEmitter())
      , parentGroup = spec ? spec.parent : null
      , groupName = spec ? spec.name : ''
      , beforeStack = []
      , afterStack = []
      , beforeEachStack = []
      , afterEachStack = []
      , includeStack = []

    self.appendBefore = function (func) {
        beforeStack.push(func);
        return self;
    };

    self.appendAfter = function (func) {
        afterStack.push(func);
        return self;
    };

    self.appendBeforeEach = function (func) {
        beforeEachStack.push(func);
        return self;
    };

    self.appendAfterEach = function (func) {
        afterEachStack.push(func);
        return self;
    };

    self.appendTest = function (spec) {
        var testName = spec.name
          , func = spec.func

        function beforeTest() {
            self.emit(TEST_START, [groupName, testName]);
        }

        includeStack.push(function () {
            var substack = [beforeTest]
                .concat(self.sequenceBeforeEach())
                .concat([func])
                .concat(self.sequenceAfterEach())
            return substack;
        });
        return self;
    };

    self.sequenceBeforeEach = function () {
        var substack = (parentGroup ? parentGroup.sequenceBeforeEach() : [])
            .concat(beforeEachStack);
        return substack;
    };

    self.sequenceAfterEach = function (callback) {
        var substack = afterEachStack
            .concat(parentGroup ? parentGroup.sequenceAfterEach() : []);
        return substack;
    };

    self.sequence = function () {
        var seq = includeStack.reduce(function (memo, substack) {
            return memo.concat(substack());
        }, beforeStack);
        return seq.concat(afterStack);
    };

    self.spawnChild = function (name) {
        var child = newGroup({name: name, parent: self});
        includeStack.push(child.sequence);
        return child;
    };

    return self;
}


function newTree() {
    var self = newObject(null)
      , root = newGroup(null)
      , currentGroup = root
      , groupMethods = [ 'appendBefore'
                       , 'appendAfter'
                       , 'appendBeforeEach'
                       , 'appendAfterEach'
                       , 'appendTest'
                       ]

    self.appendGroup = function (spec) {
        var name = spec.name
          , body = spec.body
          , parentGroup = currentGroup
          , child

        currentGroup = child = parentGroup.spawnChild(name);
        body();
        currentGroup = parentGroup;
        return child;
    };

    self.sequence = root.sequence();

    self = groupMethods.reduce(function (self, name) {
        self[name] = function (arg) {
            currentGroup[name](arg);
            return self;
        };
        return self;
    }, self);

    return self;
}


function newRunner () {
    var self = newObject(newEventEmitter())
      , tree = newTree()
      , currentlyRunning
      , eventEmitter = newEventEmitter()

    function bindMethod(name, func) {
        treeMethod = tree[name];
        self[name] = function (arg) {
            treeMethod(func(arg));
            return self;
        };
    }

    self.appendGroup = function (name, body) {
        function bodyWrap() {
            var msg
            try {
                body();
            } catch (e) {
                msg = "There was an Error thrown in the group '";
                msg += name +"':\n"+ (e.stack || e.toString());
                throw new Error(msg);
            }
        }

        var childGroup = tree.appendGroup({name: name, body: bodyWrap});

        childGroup.on(START_TEST, function (info) {
            currentlyRunning = info;
            self.emit(START_TEST, {group: info[0], test: info[1]});
        });
        childGroup.on(END_TEST, function (fullName) {
            self.emit(END_TEST, {group: info[0], test: info[1]});
        });
        return self;
    };

    bindMethod('appendBeforeRun', function (func) {
        return func;
    });

    bindMethod('appendAfterRun', function (func) {
        return func;
    });

    bindMethod('appendBeforeEach', function (func) {
        return func;
    });

    bindMethod('appendAfterEach', function (func) {
        return func;
    });

    bindMethod('appendTest', function (func) {
        return func;
    });

    self.run = function () {
        var callback
          , functions = tree.sequence().reverse()

        callback = function () {
            self.emit(DONE);
        };

        functions.forEach(function (nextFunction) {
            var child = callback;
            callback = function () {
                nextFunction(child);
            };
        });
        callback();
        return self;
    };

    return self;
}


function newSession(vocab, reporter) {
    var self = newObject(null)
      , runner = newRunner()

    vocab(runner);
    reporter(runner);

    self.run = function () {
        runner.run();
        return self;
    };

    return self;
}


function defaultVocabulary(runner) {
    global.describe = function (name, body) {
        runner.appendGroup(name, body);
        return;
    };
}


function defaultReporter(runner) {
}


function main(opts) {
    var dir = opts.path
      , msg
      , files
      , session = newSession(defaultVocabulary, defaultReporter)

    try {
        files = FS.readdirSync(dir);
    } catch (readdirErr) {
        if (readdirErr.code === 'ENOENT') {
            msg = "The directory at '"+ dir +"' could not be found.";
            throw new Error(msg);
        } else if (readdirErr.code === 'ENOTDIR') {
            msg = "The path '"+ dir +"' is not a directory.";
            throw new Error(msg);
        }

        throw readdirErr;
    }

    files.map(function (file) {
        return PATH.join(dir, file);
    }).filter(function (path) {
        var stats = FS.statSync(path);
        return stats.isFile();
    }).forEach(function (path) {
        try {
            require(path.replace(/.js$/, ''));
        } catch (e) {
            if (e.name === 'SyntaxError') {
                msg = "There was a SyntaxError in the test file '";
                msg += path +"'.";
                throw new Error(msg);
            }
            msg = "There was an Error thrown in the test file '";
            msg += path +"':\n"+ (e.stack || e.toString());
            throw new Error(msg);
        }
    })

    session.run();
}


if (require.main === module) {
    var opts
      , usage = "\nUsage: treadmill [options] <dirpath>\n\n"
    usage += "where <dirpath> is the path to a directory of test files.";

    function showHelpAndExit(msg) {
        if (msg) console.error(msg);
        OPT.showHelp();
        process.exit(1);
    }
     
    opts = OPT.usage(usage)
        .options('h', {alias: 'help', describe: "Print this help message and exit."})
        .argv

    if (opts.help) showHelpAndExit();

    opts.path = opts._[0];
    if (!opts.path) {
        showHelpAndExit("<dirpath> is a required argument.");
    }

    try {
        main(opts);
    } catch (err) {
        console.error(err.message);
        process.exit(2);
    }
}
