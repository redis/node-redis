var redis = require("./index"),
    num_clients = parseInt(process.argv[2]) || 50,
    active_clients = 0,
    clients = new Array(num_clients),
    num_requests = 20000,
    issued_requests = 0,
    latency = new Array(num_requests),
    tests = [],
    test_start;

redis.debug_mode = false;

tests.push({
    descr: "PING",
    command: ["ping"]
});

tests.push({
    descr: "SET",
    command: ["set", "foo_rand000000000000", "bar"]
});

tests.push({
    descr: "GET",
    command: ["get", "foo_rand000000000000"]
});

tests.push({
    descr: "INCR",
    command: ["incr", "counter_rand000000000000"]
});

tests.push({
    descr: "LPUSH",
    command: ["lpush", "mylist", Array(8).join("-")]
});

tests.push({
    descr: "LRANGE (10 elements)",
    command: ["lrange", "mylist", "0", "9"]
});

tests.push({
    descr: "LRANGE (100 elements)",
    command: ["lrange", "mylist", "0", "99"]
});

function create_clients(callback) {
    if (active_clients == num_clients) {
        callback();
    } else {
        var client;
        var connected = active_clients;

        while (active_clients < num_clients) {
            client = clients[active_clients++] = redis.createClient();
            client.on("connect", function() {
                /* Fire callback when all clients are connected */
                if (++connected == num_clients)
                    callback();
            });
            client.on("error", function (msg) {
                console.log("Connect problem:" + msg.stack);
            });
        }
    }
}

function issue_request(client, test, cmd, args) {
    var i = issued_requests++;
    latency[i] = new Date;

    client[cmd](args, function() {
        latency[i] = (new Date) - latency[i];
        if (issued_requests < num_requests) {
            issue_request(client, test, cmd, args);
        } else {
            client.end();
            if (--active_clients == 0)
                test_complete(test);
        }
    });
}

function test_run(test) {
    create_clients(function() {
        var i = num_clients;
        var cmd = test.command[0];
        var args = test.command.slice(1);

        test_start = new Date;
        issued_requests = 0;
        while(i-- && issued_requests < num_requests) {
            issue_request(clients[i], test, cmd, args);
        }
    });
}

function test_complete(test) {
    var min, max, sum, avg;
    var total_time = (new Date) - test_start;
    var op_rate = (issued_requests / (total_time / 1000.0)).toFixed(2);
    var i;

    latency.sort();
    min = latency[0];
    max = latency[issued_requests-1];
    for (sum = 0, i = 0; i < issued_requests; i++)
        sum += latency[i];
    avg = (sum / issued_requests).toFixed(3);

    console.log(test.descr + ": " + issued_requests + " ops " + op_rate + " ops/sec " + min + "/" + max + "/" + avg);

    next();
}

function next() {
    var test = tests.shift();
    if (test) test_run(test);
}

next();

