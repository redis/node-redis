'use strict';

var redis = require('../index'),
    client = redis.createClient();

client.eval('return 100.5', 0, function (err, res) {
    console.dir(err);
    console.dir(res);
});

client.eval([ 'return 100.5', 0 ], function (err, res) {
    console.dir(err);
    console.dir(res);
});
