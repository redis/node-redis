/*global require console setTimeout process */

var redis = require("./index"),
    request = require("request"),
    stats_url = "mjr.couchone.com/bench",
    client_count = 50,
    ops_count = 10000,
    clients = new Array(client_count),
    i, tests = {}, results = {}, test_list;

redis.debug_mode = false;

function init_test(name) {
    results[name] = {
        test_start: new Date(),
        starts: new Array(client_count),
        ends: new Array(client_count),
        completed: 0
    };
}

function test_complete(name) {
    var min, max, sum, avg, res, i, sample, total_time, op_rate, buckets = {}, max_bucket;

    results[name].test_end = new Date();

    total_time = results[name].test_end - results[name].test_start;
    
    res = results[name];

    max_bucket = Number.MIN_VALUE;
    min = Number.MAX_VALUE;
    max = Number.MIN_VALUE;
    sum = 0;

    for (i = 0, len = results[name].ends.length; i < len; i += 1) {
        sample = results[name].ends[i] - results[name].starts[i];
        if (isNaN(sample)) {
            console.log("NaN: " + i + ", " + results[name].ends[i] + ", " + results[name].starts[i]);
        }
        sum += sample;
        if (sample < min) {
            min = sample;
        }
        if (sample > max) {
            max = sample;
        }
        if (buckets[sample] === undefined) {
            buckets[sample] = 0;
        }
        buckets[sample] += 1;
        if (buckets[sample] > max_bucket) {
            max_bucket = buckets[sample];
        }
    }

    avg = (sum / ops_count).toFixed(2);
    op_rate = ((i + 1) / (total_time/1000)).toFixed(2);

    console.log(name + ": " + i + " ops " + op_rate + " ops/sec " + min + "/" + max + "/" + avg);

    function lpad(val) {
        var ret = val.toString();
        while (ret.length < max_bucket.toString().length) {
            ret = " " + ret;
        }
        return ret;
    }

    // Object.keys(buckets).forEach(function (bucket) {
    //     var bar = "", i, max_width = 100, cur_val = buckets[bucket];
    //     
    //     i = Math.round((cur_val / max_bucket) * max_width);
    //     
    //     while (i >= 0) {
    //         bar += "*";
    //         i--;
    //     }
    //     console.log(lpad(bucket) + ": " + bar);
    // });
    
    run_next();
}

function get_result(name, index) {
    results[name].starts[index] = new Date();
    return function (err, reply) {
        results[name].ends[index] = new Date();
        results[name].completed += 1;
        if (results[name].completed === ops_count) {
            test_complete(name);
        }
    }
}

function spread_command(name, command, args) {
    var remaining = ops_count - 1,
        current = 0;

    while (remaining >= 0) {
        clients[current][command](args, get_result(name, remaining));
        current += 1;
        if (current >= client_count) {
            current = 0;
        }
        remaining -= 1;
    }
}

tests.connections = function () {
    var name = "connections";

    function handle_connection (num) {
        return function () {
            results[name].ends[num] = new Date();
            results[name].completed += 1;
            start_connection(num + 1);
        }
    }
    
    function start_connection (num) {
        results[name].starts[num] = new Date();
        clients[num] = redis.createClient();
        if (num < client_count) {
            clients[num].on("connect", handle_connection(num));
        } else {
            clients[num].on("connect", function () {
                results[name].ends[num] = new Date();
                results[name].completed += 1;
                test_complete(name);
            });
        }
        clients[num].on("error", function (msg) {
            console.log("Connect problem:" + msg.stack);
        });
    }
    
    init_test(name);
    start_connection(0);
};

tests.ping = function () {
    var name = "PING (multi bulk)";
    
    init_test(name);
    spread_command(name, "ping", []);
};

tests.set = function () {
    var name = "SET";
    
    init_test(name);
    spread_command(name, "set", ["foo_rand000000000000", ops_count]);
};

tests.get = function () {
    var name = "GET";
    
    init_test(name);
    spread_command(name, "get", ["foo_rand000000000000"]);
};

tests.incr = function () {
    var name = "incr";

    init_test(name);
    spread_command(name, "incr", ["counter_rand000000000000"]);
};

tests.lpush = function () {
    var name = "lpush";
    
    init_test(name);
    spread_command(name, "lpush", ["mylist", "bar"]);
};

tests.lpop = function () {
    var name = "lpop";
    
    init_test(name);
    spread_command(name, "lpop", ["mylist"]);
};

tests.sadd = function () {
    var name = "sadd";
    
    init_test(name);
    spread_command(name, "sadd", ["myset", "counter_rand000000000000"]);
};

// need to randomize the counter

// tests.spop = function () {
//     var name = "lpop";
//     
//     init_test(name);
//     spread_command(name, "lpop", ["mylist"]);
// };


test_list = Object.keys(tests);

function run_next() {
    var cur_test = test_list.shift();
    if (typeof tests[cur_test] === "function") {
        tests[cur_test]();
    } else {
        console.log("End of tests.");
    }
}


run_next();
