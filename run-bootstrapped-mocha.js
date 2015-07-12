var pm = require('./test/lib/redis-process');
var cp = require('child_process');
var testSets = 'test/mocha/**/*.spec.js';
var async = require('async');
var redis;

process.on("exit", function () {
    if (redis) {
        redis.stop();
    }
});

async.series([function startRedis(next) {
    redis = pm.start(function (err) {
        next(err);
    });
}, function runMocha(next) {
    var mocha = cp.spawn('mocha', [testSets], {
        stdio: "inherit"
    });
    mocha.on("exit", function (code) {
        next();
    });
}, function stopRedis(next) {
    redis.stop(next);
}], function (err) {
    // done;
});
