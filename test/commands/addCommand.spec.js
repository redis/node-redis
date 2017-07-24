'use strict';

var config = require('../lib/config');
var redis = config.redis;
var assert = require('assert');

describe("The 'addCommand/add_command' method", function () {
    var client = redis.createClient();
    var testCommands = {
        newcommand  : 'newcommand',
        nonJsSafe   : 'really-new.command',
        jsSafe      : 'really_new_command'
    };

    it('camel case version exists', function () {
        assert.strictEqual(typeof redis.addCommand, 'function');
    });
    it('snake version exists', function () {
        assert.strictEqual(typeof redis.add_command, 'function');
    });
    it('does not already have the test standard command', function () {
        assert.strictEqual(client[testCommands.newcommand], undefined);
    });
    it('generates a new method for an added command', function () {
        redis.addCommand(testCommands.newcommand);
        assert.strictEqual(typeof client[testCommands.newcommand], 'function');
    });
    it('does not already have the test non-JS-safe command', function () {
        assert.strictEqual(client[testCommands.nonJsSafe], undefined);
    });
    it('converts illegal command names to JS-safe functions', function () {
        redis.addCommand(testCommands.nonJsSafe);
        assert.strictEqual(typeof client[testCommands.jsSafe], 'function');
    });
    client.quit();
});
