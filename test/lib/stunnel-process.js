'use strict';

// helper to start and stop the stunnel process.
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var util = require('util');

function once(cb) {
    var called = false;
    return function() {
        if(called) return;
        called = true;
        cb.apply(this, arguments);
    };
}

function StunnelProcess(conf_dir) {
    EventEmitter.call(this);

    // set up an stunnel to redis; edit the conf file to include required absolute paths
    var conf_file = path.resolve(conf_dir, 'stunnel.conf');
    var conf_text = fs.readFileSync(conf_file + '.template').toString().replace(/__dirname/g, conf_dir);

    fs.writeFileSync(conf_file, conf_text);
    var stunnel = this.stunnel = spawn('stunnel', [conf_file]);

    // handle child process events, and failure to set up tunnel
    var self = this;
    this.timer = setTimeout(function() {
        self.emit('error', new Error('Timeout waiting for stunnel to start'));
    }, 8000);

    stunnel.on('error', function(err) {
        self.clear();
        self.emit('error', err);
    });

    stunnel.on('exit', function(code) {
        self.clear();
        if(code === 0) {
            self.emit('stopped');
        } else {
            self.emit('error', new Error('Stunnel exited unexpectedly; code = ' + code));
        }
    });

    // wait to stunnel to start
    stunnel.stderr.on("data", function(data) {
        if(data.toString().match(/Service.+redis.+bound/)) {
            clearTimeout(this.timer);
            self.emit('started');
        }
    });
}
util.inherits(StunnelProcess, EventEmitter);

StunnelProcess.prototype.clear = function() {
    this.stunnel = null;
    clearTimeout(this.timer);
};

StunnelProcess.prototype.stop = function(done) {
    if (this.stunnel) {
        this.stunnel.kill();
    }
};

module.exports = {
    start: function(done, conf_dir) {
        done = once(done);
        var stunnel = new StunnelProcess(conf_dir);
        stunnel.once('error', done.bind(done));
        stunnel.once('started', done.bind(done, null, stunnel));
    },
    stop: function(stunnel, done) {
        stunnel.removeAllListeners();
        stunnel.stop();
        stunnel.once('error', done.bind(done));
        stunnel.once('stopped', done.bind(done, null));
    }
};
