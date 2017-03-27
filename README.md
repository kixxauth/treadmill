Treadmill
=========
A build tool for Node.js programs.

### Installation
Install globally with

    npm install -g treadmill

Or add to your local dependencies in `package.json` with

    npm install --save treadmill

### Example
Say you have a project folder that looks something like this:

```
├── frontend
│   └── scripts
│   |   ├── main.js
│   |   └── store.js
|   └── styles
│       ├── main.scss
│       └── buttons.scss
├── public
│   └── assets
└── server
    └── server.js
```

You could write an asset build file for Treadmill in the root of your project as `build.js` like this:

```js
'use strict';

const treadmill = require('treadmill');
const browserify = require('browserify');
const sass = require('sass');

const task = treadmill.task;
const Promise = treadmill.Promise;
const log = treadmill.log;

task('bundle-js', function (args, done) {
  const cwd = args.get('currentWorkingDirectory');
  const src = cwd.append('frontend', 'scripts', 'main.js');

  const bundler = browserify({
    debug: true,
    entries: [src]
  });

  return bundler.bundle().on('error', done);
});

task('bundle-sass', function (args, done) {
  const src = args.cwd.append('frontend', 'scripts', 'main.js');

  const options = {
    file: src.toString(),
    outputStyle: 'compact'
  };

  sass.render(options, done);
});

task('build-assets', ['bundle-js', 'bundle-sass'], function (args) {
  const cwd = args.get('currentWorkingDirectory');
  const jsDest = cwd.append('public', 'assets', 'scripts', 'main.js');
  const cssDest = cwd.append('public', 'assets', 'styles', 'main.css');

  return Promise.all([
    jsDest.write(args.get('bundle-js')).then(function (file) {
      log('JavaScript bundle %d', file.stats().size);
    }),
    cssDest.write(args.get('bundle-sass')).then(function (file) {
      log('CSS bundle %d', file.stats().size);
    })
  ]);
});
```

And run it like this:

    treadmill build.js build-assets

### Creating Tasks
Use the `task()` function like in the example above to create tasks. `task()` takes 3 parameters:

- __name__ - String name of the task (will be used in arguments to Handler Function later; see below). *required*
- __dependencies__ - Array of names of tasks which should automatically be run first. *optional*
- __handler__ - The handler Function (see Handler Function below). *required*

The listed dependency tasks will be run first and the results passed into your handler (see Handler Function below).

### Handler Function
Your Handler Function will be passed 2 arguments:

- __args__ - An Immutable.Map of the results from your dependencies as well as a few helpful defaults (see Handler Arguments below).
- __done__ - A callback Function to signal the task is complete.

#### Handler - args
The first argument passed to your handler is called `args` and it is an Immutable.Map of some useful default values as well as the results of all your dependencies. Since `args` is an Immutable Object you'll need to get values from it using the getter like this:

`const cwd = args.get('currentWorkingDirectory');`

#### Handler - args defaults

- __currentWorkingDirectory__ A [Filepath](https://github.com/kixxauth/filepath#api-reference) Object representing the current working directory.

#### Example using args

```js
task('build-something', ['collect-files'], args => {
  // The results of dependency tasks are collected into the args
  // Immutable.Map for you.
  const files = args.get('collect-files');

  // Available by default
  const cwd = args.get('currentWorkingDirectory');

  return buildSomethingAsync(cwd, files);
});
```

#### Handler - done
If you accept the `done` argument like this:

```js
task('build-something', (args, done) => {
  buildSomething(done);
});
```

Your task will not complete until `done()` is called. If you pass an argument to `done()` Treadmill will assume it is an error and report it as such. This is a Node.js convention.

__Treadmill Knows Promises!__
If you do not accept the `done` argument in your handler like this:

```js
task('build-something', (args) => {
  return buildSomethingAsync().then(result => {
    return compressSomething(result);
  });
});
```

Treadmill will assume that you returned a Promise from your Handler and will report the resolve or reject from that promise.


Copyright and License
---------------------
Copyright (c) 2013 - 2016 by Kris Walker <kris@kixx.name> (http://www.kixx.name).

Unless otherwise indicated, all source code is licensed under the MIT license. See MIT-LICENSE for details.
