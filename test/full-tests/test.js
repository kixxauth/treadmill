function log(msg) {
    console.log('-', msg);
}

log('PARSE START');

beforeRun(function (done) {
    log('layer 0; beforeRun 1');
    return done();
});

afterRun(function (done) {
    log('layer 0; afterRun 1');
    return done();
});

beforeEach(function (done) {
    log('layer 0; beforeEach 1');
    return done();
});

afterEach(function (done) {
    log('layer 0; afterEach 1');
    return done();
});

describe('layer 1a', function () {

    it('1', function (done) {
        log('layer 1a; test 1');
        return done();
    });
});

afterRun(function (done) {
    log('layer 0; afterRun 2');
    return done();
});

beforeRun(function (done) {
    log('layer 0; beforeRun 2');
    return done();
});

describe('layer 1b', function () {

    it('1', function (done) {
        log('layer 1b; test 1');
        return done();
    });
});

beforeEach(function (done) {
    log('layer 0; beforeEach 2');
    return done();
});

afterEach(function (done) {
    log('layer 0; afterEach 2');
    return done();
});

log('PARSE END');
