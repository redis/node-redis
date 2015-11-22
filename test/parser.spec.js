'use strict';

var assert = require('assert');
var utils = require("../lib/utils");
var parsers = [
    require("../lib/parsers/javascript").Parser
];
try {
    // Test the hiredis parser if available
    parsers.push(require("../lib/parsers/hiredis").Parser);
} catch (e) {}

describe('parsers', function () {

    parsers.forEach(function (Parser) {

        describe(Parser.name, function () {

            it('handles multi-bulk reply', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
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

            it('parser error', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    assert.strictEqual(reply.message, 'Protocol error, got "a" as reply type byte');
                    reply_count++;
                }
                parser.send_error = check_reply;

                parser.execute(new Buffer('a*1\r*1\r$1`zasd\r\na'));

                assert.equal(reply_count, 1, "check reply should have been called one time");
                return done();
            });

            it('line breaks in the beginning of the last chunk', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.deepEqual(reply, [['a']], "Expecting multi-bulk reply of [['a']]");
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na'));

                parser.execute(new Buffer('\r\n*1\r\n*1\r'));
                parser.execute(new Buffer('\n$1\r\na\r\n*1\r\n*1\r\n$1\r\na\r\n'));

                assert.equal(reply_count, 3, "check reply should have been called three times");
                return done();
            });

            it('multiple chunks in a bulk string', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.strictEqual(reply, "abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij");
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('$100\r\nabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                assert.strictEqual(reply_count, 0);
                parser.execute(new Buffer('\r\n'));
                assert.strictEqual(reply_count, 1);

                parser.execute(new Buffer('$100\r'));
                parser.execute(new Buffer('\nabcdefghijabcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghij'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer(
                    'abcdefghij\r\n' +
                    '$100\r\nabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij\r\n' +
                    '$100\r\nabcdefghijabcdefghijabcdefghijabcdefghij'
                ));
                assert.strictEqual(reply_count, 3);
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij\r'));
                assert.strictEqual(reply_count, 3);
                parser.execute(new Buffer('\n'));

                assert.equal(reply_count, 4, "check reply should have been called three times");
                return done();
            });

            it('multiple chunks with arrays different types', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.deepStrictEqual(reply, [
                        'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij',
                        'test',
                        100,
                        new Error('Error message'),
                        ['The force awakens']
                    ]);
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('*5\r\n$100\r\nabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij'));
                parser.execute(new Buffer('abcdefghijabcdefghijabcdefghij\r\n'));
                parser.execute(new Buffer('+test\r'));
                parser.execute(new Buffer('\n:100'));
                parser.execute(new Buffer('\r\n-Error message'));
                parser.execute(new Buffer('\r\n*1\r\n$17\r\nThe force'));
                assert.strictEqual(reply_count, 0);
                parser.execute(new Buffer(' awakens\r\n$5'));
                assert.strictEqual(reply_count, 1);
                return done();
            });

            it('return normal errors', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    assert.equal(reply.message, 'Error message');
                    reply_count++;
                }
                parser.send_error = check_reply;

                parser.execute(new Buffer('-Error '));
                parser.execute(new Buffer('message\r\n*3\r\n$17\r\nThe force'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer(' awakens\r\n$5'));
                assert.strictEqual(reply_count, 1);
                return done();
            });

            it('return null for empty arrays and empty bulk strings', function (done) {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    assert.equal(reply, null);
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('$-1\r\n*-'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer('1'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer('\r\n$-'));
                assert.strictEqual(reply_count, 2);
                return done();
            });
        });
    });
});
