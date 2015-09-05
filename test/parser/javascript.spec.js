/* global describe, it */

var assert = require('assert');
var Parser = require("../../lib/parser/javascript").Parser;

describe('javascript parser', function () {
    it('handles multi-bulk reply', function (done) {
        var parser = new Parser(false);
        var reply_count = 0;
        function check_reply(reply) {
            assert.deepEqual(reply, [['a']], "Expecting multi-bulk reply of [['a']]");
            reply_count++;
        }
        parser.send_reply = check_reply;

        parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na\r\n'));

        parser.execute(new Buffer('*1\r\n*1\r'));
        parser.execute(new Buffer('\n$1\r\na\r\n'));

        parser.execute(new Buffer('*1\r\n*1\r\n'));
        parser.execute(new Buffer('$1\r\na\r\n'));

        assert.equal(reply_count, 3, "check reply should have been called three times");
        return done();
    });
});
