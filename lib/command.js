'use strict';

// This Command constructor is ever so slightly faster than using an object literal, but more importantly, using
// a named constructor helps it show up meaningfully in the V8 CPU profiler and in heap snapshots.
function Command (command, args, callback) {
    this.command = command;
    this.args = args; // We only need the args for the offline commands => move them into another class. We need the number of args though for pub sub
    this.buffer_args = false;
    this.callback = callback;
    this.sub_commands_left = args.length;
}

function OfflineCommand (command, args, callback) {
    this.command = command;
    this.args = args;
    this.callback = callback;
}

module.exports = {
    Command: Command,
    OfflineCommand: OfflineCommand
};
