'use strict';

// This Command constructor is ever so slightly faster than using an object literal, but more importantly, using
// a named constructor helps it show up meaningfully in the V8 CPU profiler and in heap snapshots.
function Command(command, args, buffer_args, callback) {
    this.command = command;
    this.args = args;
    this.buffer_args = buffer_args;
    this.callback = callback;
}

module.exports = Command;
