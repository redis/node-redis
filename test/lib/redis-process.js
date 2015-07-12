var cp = require('child_process');

module.exports = {
    start: function (done, isSocket) {
        var confFile = isSocket ? "test/conf/redis-socket.conf" : "test/conf/redis.conf";
        var redis = cp.spawn("redis-server", [confFile]);

        redis.once('err', done);
        setTimeout(function (data) {
            redis.removeListener('err', done);
            done();
        }, 1000);

        return {
            stop: function (done) {
                redis.once("exit", function () {
                    done();
                });
                redis.kill("SIGINT");
            }
        };
    }
};
