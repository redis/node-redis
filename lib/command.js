'use strict';

// This Command constructor is ever so slightly faster than using an object literal, but more importantly, using
// a named constructor helps it show up meaningfully in the V8 CPU profiler and in heap snapshots.
function Command (command, args, buffer_args, callback) {
    this.command = command;
    this.args = args; // We only need the args for the offline commands => move them into another class. We need the number of args though for pub sub
    this.buffer_args = buffer_args;
    this.callback = callback;
    this.sub_commands_left = args.length;
}

function OfflineCommand (command, args, callback, call_on_write) {
    this.command = command;
    this.args = args;
    this.callback = callback;
    this.call_on_write = call_on_write;
}

module.exports = {
    Command: Command,
    OfflineCommand: OfflineCommand
};
