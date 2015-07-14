var cp = require('child_process');
var config = require('./config');
var path = require('path');
var tcpPortUsed = require('tcp-port-used');

module.exports = {
    start: function (done) {
        // spawn redis with our testing configuration.
        var confFile = path.resolve(__dirname, '../conf/redis.conf');
        var rp = cp.spawn("redis-server", [confFile], {});

        // wait for redis to become available, by
        // checking the port we bind on.
        var id = setInterval(function () {
          tcpPortUsed.check(config.PORT, '127.0.0.1')
              .then(function (inUse) {
                  if (inUse) {
                      clearInterval(id);

                      // return an object that can be used in
                      // an after() block to shutdown redis.
                      return done(null, {
                          stop: function (done) {
                              rp.once("exit", function (code) {
                                  var error = null;
                                  if (code !== null && code !== 0) {
                                      error = Error('Redis shutdown failed with code ' + code);
                                  }
                                  return done(error);
                              });
                              rp.kill("SIGINT");
                          }
                      });
                  }
              })
              .catch(function (err) {
                  clearInterval(id);
                  return done(err);
              })
        }, 100);
    }
};
