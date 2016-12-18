'use strict';

// helper to start and stop the stunnel process.
var spawn = require('child_process').spawn;
var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');
var util = require('util');

function once (cb) {
    var called = false;
    return function () {
        if (called) return;
        called = true;
        cb.apply(this, arguments);
    };
}

function StunnelProcess (confDir) {
    EventEmitter.call(this);

    // set up an stunnel to redis; edit the conf file to include required absolute paths
    var confFile = path.resolve(confDir, 'stunnel.conf');
    var confText = fs.readFileSync(confFile + '.template').toString().replace(/__dirname,/g, confDir);

    fs.writeFileSync(confFile, confText);
    var stunnel = this.stunnel = spawn('stunnel', [confFile]);

    // handle child process events, and failure to set up tunnel
    var self = this;
    this.timer = setTimeout(function () {
        self.emit('error', new Error('Timeout waiting for stunnel to start'));
    }, 8000);

    stunnel.on('error', function (err) {
        self.clear();
        self.emit('error', err);
    });

    stunnel.on('exit', function (code) {
        self.clear();
        if (code === 0) {
            self.emit('stopped');
        } else {
            self.emit('error', new Error('Stunnel exited unexpectedly; code = ' + code));
        }
    });

    // wait to stunnel to start
    stunnel.stderr.on('data', function (data) {
        if (data.toString().match(/Service.+redis.+bound/)) {
            clearTimeout(this.timer);
            self.emit('started');
        }
    });
}
util.inherits(StunnelProcess, EventEmitter);

StunnelProcess.prototype.clear = function () {
    this.stunnel = null;
    clearTimeout(this.timer);
};

StunnelProcess.prototype.stop = function (done) {
    if (this.stunnel) {
        this.stunnel.kill();
    }
};

module.exports = {
    start: function (done, confDir) {
        done = once(done);
        var stunnel = new StunnelProcess(confDir);
        stunnel.once('error', done.bind(done));
        stunnel.once('started', done.bind(done, null, stunnel));
    },
    stop: function (stunnel, done) {
        stunnel.removeAllListeners();
        stunnel.stop();
        stunnel.once('error', done.bind(done));
        stunnel.once('stopped', done.bind(done, null));
    }
};
