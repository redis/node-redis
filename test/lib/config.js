module.exports = (function () {
    var redis = require('../../index');
    redis.debug_mode = process.env.DEBUG ? JSON.parse(process.env.DEBUG) : false;

    var config = {
        redis: redis,
        PORT: 6378,
        HOST: {
            IPv4: "127.0.0.1",
            IPv6: "::1"
        }
    };

    config.configureClient = function (parser, ip, isSocket) {
        var args = [];

        if (!isSocket) {
            args.push(config.PORT);
            args.push(config.HOST[ip]);
            args.push({ family: ip, parser: parser });
        } else {
            args.push(ip);
            args.push({ parser: parser });
        }

        return args;
    };

    return config;
})();
