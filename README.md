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
const treadmill = require('treadmill');
const task = treadmill.task;
const Promise = treadmill.Promise;
const log = treadmill.log;

const browserify = require('browserify');
const sass = require('sass');

task('bundle-js', function (args, done) {
  const cwd = args.get('currentWorkingDirectory');
  const src = cwd.append('frontend', 'scripts', 'main.js');
  const dest = cwd.append('public', 'assets', 'scripts', 'main.js');

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


Copyright and License
---------------------
Copyright (c) 2013 - 2016 by Kris Walker <kris@kixx.name> (http://www.kixx.name).

Unless otherwise indicated, all source code is licensed under the MIT license. See MIT-LICENSE for details.
