/*global require console setTimeout process */

var redis = require("./index"),
    client_count = 10000,
    tests_per_client = 100,
    clients = new Array(client_count), i, tests = {}, results = {}, test_list;

function get_result(name, index) {
    results[name].starts[index] = new Date();
    return function (err, reply) {
        results[name].ends[index] = new Date();
        results[name].completed += 1;
        if (results[name].completed === client_count) {
            test_complete(name);
        }
    }
}

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

    avg = (sum / client_count).toFixed(2);
    op_rate = ((i + 1) / (total_time/1000)).toFixed(2);

    console.log(name + ": " + i + " ops " + op_rate + " ops/sec " + min + "/" + max + "/" + avg);

    function lpad(val) {
        var ret = val.toString();
        while (ret.length < max_bucket.toString().length) {
            ret = " " + ret;
        }
        return ret;
    }

    Object.keys(buckets).forEach(function (bucket) {
        var bar = "", i, max_width = 100, cur_val = buckets[bucket];
        
        i = Math.round((cur_val / max_bucket) * max_width);
        
        while (i >= 0) {
            bar += "*";
            i--;
        }
        console.log(lpad(bucket) + ": " + bar);
    });
    
    run_next();
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
        if (num < (client_count - 1)) {
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

tests.set = function () {
    
};

test_list = Object.keys(tests);

function run_next() {
    var cur_test = test_list.shift();
    if (typeof tests[cur_test] === "function") {
        console.log("Starting " + cur_test);
        tests[cur_test]();
    } else {
        console.log("End of tests.");
        process.exit();
    }
}


run_next();
