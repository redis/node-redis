'use strict';

var path = require('path');
var RedisProcess = require('../test/lib/redis-process');
var rp;
var client_nr = 0;
var redis = require('../index');
var totalTime = 0;
var metrics = require('metrics');
var tests = [];
// var bluebird = require('bluebird');
// bluebird.promisifyAll(redis.RedisClient.prototype);
// bluebird.promisifyAll(redis.Multi.prototype);

function returnArg (name, def) {
    var matches = process.argv.filter(function(entry) {
        return entry.indexOf(name + '=') === 0;
    });
    if (matches.length) {
        return matches[0].substr(name.length + 1);
    }
    return def;
}
var num_clients = returnArg('clients', 1);
var run_time = returnArg('time', 2500); // ms
var versions_logged = false;
var client_options = {
        return_buffers: false,
        max_attempts: 4,
        parser: returnArg('parser', 'hiredis')
    };
var small_str, large_str, small_buf, large_buf, very_large_str, very_large_buf;

function lpad(input, len, chr) {
    var str = input.toString();
    chr = chr || ' ';
    while (str.length < len) {
        str = chr + str;
    }
    return str;
}

metrics.Histogram.prototype.print_line = function () {
    var obj = this.printObj();
    return lpad(obj.min, 4) + '/' + lpad(obj.max, 4) + '/' + lpad(obj.mean.toFixed(2), 7) + '/' + lpad(obj.p95.toFixed(2), 7);
};

function Test(args) {
    this.args = args;
    this.callback = null;
    this.clients = [];
    this.clients_ready = 0;
    this.commands_sent = 0;
    this.commands_completed = 0;
    this.max_pipeline = this.args.pipeline || 50;
    this.batch_pipeline = this.args.batch || 0;
    this.client_options = args.client_options || client_options;
    this.connect_latency = new metrics.Histogram();
    this.ready_latency = new metrics.Histogram();
    this.command_latency = new metrics.Histogram();
}

Test.prototype.run = function (callback) {
    var i;
    this.callback = callback;
    for (i = 0; i < num_clients ; i++) {
        this.new_client(i);
    }
};

Test.prototype.new_client = function (id) {
    var self = this, new_client;

    new_client = redis.createClient(this.client_options);
    new_client.create_time = Date.now();

    new_client.on('connect', function () {
        self.connect_latency.update(Date.now() - new_client.create_time);
    });

    new_client.on('ready', function () {
        if (! versions_logged) {
            console.log('Client count: ' + num_clients + ', node version: ' + process.versions.node + ', server version: ' +
                new_client.server_info.redis_version + ', parser: ' + new_client.reply_parser.name);
            versions_logged = true;
        }
        self.ready_latency.update(Date.now() - new_client.create_time);
        self.clients_ready++;
        if (self.clients_ready === self.clients.length) {
            self.on_clients_ready();
        }
    });

    // If no redis server is running, start one
    new_client.on('error', function(err) {
        if (err.code === 'CONNECTION_BROKEN') {
            throw err;
        }
        if (rp) {
            return;
        }
        rp = true;
        var conf = '../test/conf/redis.conf';
        RedisProcess.start(function (err, _rp) {
            if (err) {
                throw err;
            }
            rp = _rp;
        }, path.resolve(__dirname, conf));
    });

    self.clients[id] = new_client;
};

Test.prototype.on_clients_ready = function () {
    process.stdout.write(lpad(this.args.descr, 13) + ', ' + (this.args.batch ? lpad('batch ' + this.args.batch, 9) : lpad(this.args.pipeline, 9)) + '/' + this.clients_ready + ' ');
    this.test_start = Date.now();
    this.fill_pipeline();
};

Test.prototype.fill_pipeline = function () {
    var pipeline = this.commands_sent - this.commands_completed;

    if (this.test_start < Date.now() - run_time) {
        if (this.ended) {
            return;
        }
        this.ended = true;
        this.print_stats();
        this.stop_clients();
        return;
    }

    if (this.clients[0].should_buffer) {
        var self = this;
        setTimeout(function() {
            self.fill_pipeline();
        }, 1);
        return;
    }

    if (this.batch_pipeline) {
        this.batch();
    } else {
        while (pipeline < this.max_pipeline) {
            this.commands_sent++;
            pipeline++;
            this.send_next();
        }
    }
};

Test.prototype.batch = function () {
    var self = this,
        cur_client = client_nr++ % this.clients.length,
        start = Date.now(),
        i = 0,
        batch = this.clients[cur_client].batch();

    while (i++ < this.batch_pipeline) {
        this.commands_sent++;
        batch[this.args.command](this.args.args);
    }

    batch.exec(function (err, res) {
        if (err) {
            throw err;
        }
        self.commands_completed += res.length;
        self.command_latency.update(Date.now() - start);
        self.fill_pipeline();
    });
};

Test.prototype.stop_clients = function () {
    var self = this;

    this.clients.forEach(function (client, pos) {
        if (pos === self.clients.length - 1) {
            client.quit(function (err, res) {
                self.callback();
            });
        } else {
            client.quit();
        }
    });
};

Test.prototype.send_next = function () {
    var self = this,
        cur_client = this.commands_sent % this.clients.length,
        start = Date.now();

    this.clients[cur_client][this.args.command](this.args.args, function (err, res) {
        if (err) {
            throw err;
        }
        self.commands_completed++;
        self.command_latency.update(Date.now() - start);
        self.fill_pipeline();
    });
};

Test.prototype.print_stats = function () {
    var duration = Date.now() - this.test_start;
    totalTime += duration;

    console.log('min/max/avg/p95: ' + this.command_latency.print_line() + ' ' + lpad(duration, 6) + 'ms total, ' +
        lpad((this.commands_completed / (duration / 1000)).toFixed(2), 9) + ' ops/sec');
};

small_str = '1234';
small_buf = new Buffer(small_str);
large_str = (new Array(4096 + 1).join('-'));
large_buf = new Buffer(large_str);
very_large_str = (new Array((4 * 1024 * 1024) + 1).join('-'));
very_large_buf = new Buffer(very_large_str);

tests.push(new Test({descr: 'PING', command: 'ping', args: [], pipeline: 1}));
// tests.push(new Test({descr: 'PING', command: 'ping', args: [], pipeline: 50}));
tests.push(new Test({descr: 'PING', command: 'ping', args: [], batch: 50}));

tests.push(new Test({descr: 'SET 4B str', command: 'set', args: ['foo_rand000000000000', small_str], pipeline: 1}));
// tests.push(new Test({descr: 'SET 4B str', command: 'set', args: ['foo_rand000000000000', small_str], pipeline: 50}));
tests.push(new Test({descr: 'SET 4B str', command: 'set', args: ['foo_rand000000000000', small_str], batch: 50}));

tests.push(new Test({descr: 'SET 4B buf', command: 'set', args: ['foo_rand000000000000', small_buf], pipeline: 1}));
// tests.push(new Test({descr: 'SET 4B buf', command: 'set', args: ['foo_rand000000000000', small_buf], pipeline: 50}));
tests.push(new Test({descr: 'SET 4B buf', command: 'set', args: ['foo_rand000000000000', small_buf], batch: 50}));

tests.push(new Test({descr: 'GET 4B str', command: 'get', args: ['foo_rand000000000000'], pipeline: 1}));
// tests.push(new Test({descr: 'GET 4B str', command: 'get', args: ['foo_rand000000000000'], pipeline: 50}));
tests.push(new Test({descr: 'GET 4B str', command: 'get', args: ['foo_rand000000000000'], batch: 50}));

tests.push(new Test({descr: 'GET 4B buf', command: 'get', args: ['foo_rand000000000000'], pipeline: 1, client_opts: { return_buffers: true} }));
// tests.push(new Test({descr: 'GET 4B buf', command: 'get', args: ['foo_rand000000000000'], pipeline: 50, client_opts: { return_buffers: true} }));
tests.push(new Test({descr: 'GET 4B buf', command: 'get', args: ['foo_rand000000000000'], batch: 50, client_opts: { return_buffers: true} }));

tests.push(new Test({descr: 'SET 4KiB str', command: 'set', args: ['foo_rand000000000001', large_str], pipeline: 1}));
// tests.push(new Test({descr: 'SET 4KiB str', command: 'set', args: ['foo_rand000000000001', large_str], pipeline: 50}));
tests.push(new Test({descr: 'SET 4KiB str', command: 'set', args: ['foo_rand000000000001', large_str], batch: 50}));

tests.push(new Test({descr: 'SET 4KiB buf', command: 'set', args: ['foo_rand000000000001', large_buf], pipeline: 1}));
// tests.push(new Test({descr: 'SET 4KiB buf', command: 'set', args: ['foo_rand000000000001', large_buf], pipeline: 50}));
tests.push(new Test({descr: 'SET 4KiB buf', command: 'set', args: ['foo_rand000000000001', large_buf], batch: 50}));

tests.push(new Test({descr: 'GET 4KiB str', command: 'get', args: ['foo_rand000000000001'], pipeline: 1}));
// tests.push(new Test({descr: 'GET 4KiB str', command: 'get', args: ['foo_rand000000000001'], pipeline: 50}));
tests.push(new Test({descr: 'GET 4KiB str', command: 'get', args: ['foo_rand000000000001'], batch: 50}));

tests.push(new Test({descr: 'GET 4KiB buf', command: 'get', args: ['foo_rand000000000001'], pipeline: 1, client_opts: { return_buffers: true} }));
// tests.push(new Test({descr: 'GET 4KiB buf', command: 'get', args: ['foo_rand000000000001'], pipeline: 50, client_opts: { return_buffers: true} }));
tests.push(new Test({descr: 'GET 4KiB buf', command: 'get', args: ['foo_rand000000000001'], batch: 50, client_opts: { return_buffers: true} }));

tests.push(new Test({descr: 'INCR', command: 'incr', args: ['counter_rand000000000000'], pipeline: 1}));
// tests.push(new Test({descr: 'INCR', command: 'incr', args: ['counter_rand000000000000'], pipeline: 50}));
tests.push(new Test({descr: 'INCR', command: 'incr', args: ['counter_rand000000000000'], batch: 50}));

tests.push(new Test({descr: 'LPUSH', command: 'lpush', args: ['mylist', small_str], pipeline: 1}));
// tests.push(new Test({descr: 'LPUSH', command: 'lpush', args: ['mylist', small_str], pipeline: 50}));
tests.push(new Test({descr: 'LPUSH', command: 'lpush', args: ['mylist', small_str], batch: 50}));

tests.push(new Test({descr: 'LRANGE 10', command: 'lrange', args: ['mylist', '0', '9'], pipeline: 1}));
// tests.push(new Test({descr: 'LRANGE 10', command: 'lrange', args: ['mylist', '0', '9'], pipeline: 50}));
tests.push(new Test({descr: 'LRANGE 10', command: 'lrange', args: ['mylist', '0', '9'], batch: 50}));

tests.push(new Test({descr: 'LRANGE 100', command: 'lrange', args: ['mylist', '0', '99'], pipeline: 1}));
// tests.push(new Test({descr: 'LRANGE 100', command: 'lrange', args: ['mylist', '0', '99'], pipeline: 50}));
tests.push(new Test({descr: 'LRANGE 100', command: 'lrange', args: ['mylist', '0', '99'], batch: 50}));

tests.push(new Test({descr: 'SET 4MiB str', command: 'set', args: ['foo_rand000000000002', very_large_str], pipeline: 1}));
// tests.push(new Test({descr: 'SET 4MiB str', command: 'set', args: ['foo_rand000000000002', very_large_str], pipeline: 20}));
tests.push(new Test({descr: 'SET 4MiB str', command: 'set', args: ['foo_rand000000000002', very_large_str], batch: 20}));

tests.push(new Test({descr: 'SET 4MiB buf', command: 'set', args: ['foo_rand000000000002', very_large_buf], pipeline: 1}));
// tests.push(new Test({descr: 'SET 4MiB buf', command: 'set', args: ['foo_rand000000000002', very_large_buf], pipeline: 20}));
tests.push(new Test({descr: 'SET 4MiB buf', command: 'set', args: ['foo_rand000000000002', very_large_buf], batch: 20}));

tests.push(new Test({descr: 'GET 4MiB str', command: 'get', args: ['foo_rand000000000002'], pipeline: 1}));
// tests.push(new Test({descr: 'GET 4MiB str', command: 'get', args: ['foo_rand000000000002'], pipeline: 20}));
tests.push(new Test({descr: 'GET 4MiB str', command: 'get', args: ['foo_rand000000000002'], batch: 20}));

tests.push(new Test({descr: 'GET 4MiB buf', command: 'get', args: ['foo_rand000000000002'], pipeline: 1, client_opts: { return_buffers: true} }));
// tests.push(new Test({descr: 'GET 4MiB buf', command: 'get', args: ['foo_rand000000000002'], pipeline: 20, client_opts: { return_buffers: true} }));
tests.push(new Test({descr: 'GET 4MiB buf', command: 'get', args: ['foo_rand000000000002'], batch: 20, client_opts: { return_buffers: true} }));

function next() {
    var test = tests.shift();
    if (test) {
        test.run(function () {
            next();
        });
    } else if (rp) {
        // Stop the redis process if started by the benchmark
        rp.stop(function() {
            rp = undefined;
            next();
        });
    } else {
        console.log('End of tests. Total time elapsed:', totalTime, 'ms');
        process.exit(0);
    }
}

next();
