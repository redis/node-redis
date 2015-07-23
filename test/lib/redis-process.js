// helper to start and stop the redis process.
var cp = require('child_process');
var config = require('./config');
var fs = require('fs');
var path = require('path');
var tcpPortUsed = require('tcp-port-used');

module.exports = {
    start: function (done, conf) {
        // spawn redis with our testing configuration.
        var confFile = conf || path.resolve(__dirname, '../conf/redis.conf');
        var rp = cp.spawn("redis-server", [confFile], {});

        // wait for redis to become available, by
        // checking the port we bind on.
        waitForRedis(true, function () {
            // return an object that can be used in
            // an after() block to shutdown redis.
            return done(null, {
                stop: function (done) {
                    rp.once("exit", function (code) {
                        var error = null;
                        if (code !== null && code !== 0) {
                            error = Error('Redis shutdown failed with code ' + code);
                        }
                        waitForRedis(false, function () {
                            return done(error);
                        })
                    });
                    rp.kill("SIGTERM");
                }
            });
        });
    }
};

// wait for redis to be listening in
// all three modes (ipv4, ipv6, socket).
function waitForRedis (available, cb) {
    var ipV4 = false;
    var id = setInterval(function () {
      tcpPortUsed.check(config.PORT, '127.0.0.1')
          .then(function (_ipV4) {
              ipV4 = _ipV4;
              return tcpPortUsed.check(config.PORT, '::1');
          })
          .then(function (ipV6) {
              if (ipV6 === available && ipV4 === available &&
                fs.existsSync('/tmp/redis.sock') === available) {
                  clearInterval(id);
                  return cb();
              }
          });
    }, 100);
}
