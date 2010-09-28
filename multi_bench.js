/*global require console setTimeout process */

var redis = require("./index"),
    client_count = 500,
    clients = new Array(client_count), i, tests = {}, results = {}, test_list;

function get_result(name, index) {
    return function (err, reply) {
        results[name].samples[index] = new Date();
        results[name].completed += 1;
        if (results[name].completed === client_count) {
            test_complete(name);
        }
    }
}

function init_test(name) {
    results[name] = {
        start: new Date(),
        samples: new Array(client_count),
        completed: 0
    };
}

function test_complete(name) {
    var min, max, sum, avg, res;
    
    res = results[name];

    min = res.samples[0] - res.start;
    max = res.samples[0] - res.start;
    sum = 0;

    results[name].samples.forEach(function (sample, index) {
        sample -= res.start;
        sum += sample;
        if (sample < min) {
            min = sample;
        }
        if (sample > max) {
            max = sample;
        }
    });

    avg = (sum / client_count).toFixed(2);

    console.log(name + ": " + min + "/" + max + "/" + avg);
}

tests.connections = function () {
    var name = "connections";
    
    init_test(name);

    for (i = 0; i < client_count ; i += 1) {
        clients[i] = redis.createClient();
        clients[i].on("connect", get_result("connections", i));
        clients[i].on("error", function (msg) {
            console.log("Connect problem: " + msg);
        });
    }
};

test_list = Object.keys(tests);

function run_next() {
    var cur_test = test_list.shift();
    if (typeof tests[cur_test] === "function") {
        console.log("Starting " + cur_test);
        tests[cur_test]();
    } else {
        console.log("End of tests.");
    }
}

run_next();
