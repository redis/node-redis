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

            it('handles multi-bulk reply', function () {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.deepEqual(reply, [['a']], "Expecting multi-bulk reply of [['a']]");
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na\r\n'));
                assert.strictEqual(reply_count, 1);

                parser.execute(new Buffer('*1\r\n*1\r'));
                parser.execute(new Buffer('\n$1\r\na\r\n'));
                assert.strictEqual(reply_count, 2);

                parser.execute(new Buffer('*1\r\n*1\r\n'));
                parser.execute(new Buffer('$1\r\na\r\n'));

                assert.equal(reply_count, 3, "check reply should have been called three times");
            });

            it('parser error', function () {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply (reply) {
                    assert.strictEqual(reply.message, 'Protocol error, got "a" as reply type byte');
                    reply_count++;
                }
                parser.send_error = check_reply;

                parser.execute(new Buffer('a*1\r*1\r$1`zasd\r\na'));
                assert.equal(reply_count, 1);
            });

            it('parser error v2', function () {
                var parser = new Parser();
                var reply_count = 0;
                var err_count = 0;
                function check_reply (reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.strictEqual(reply[0], 'OK');
                    reply_count++;
                }
                function check_error (err) {
                    assert.strictEqual(err.message, 'Protocol error, got "b" as reply type byte');
                    err_count++;
                }
                parser.send_error = check_error;
                parser.send_reply = check_reply;

                parser.execute(new Buffer('*1\r\n+OK\r\nb$1`zasd\r\na'));
                assert.strictEqual(reply_count, 1);
                assert.strictEqual(err_count, 1);
            });

            it('parser error v3', function () {
                var parser = new Parser();
                var reply_count = 0;
                var err_count = 0;
                function check_reply (reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.strictEqual(reply[0], 'OK');
                    reply_count++;
                }
                function check_error (err) {
                    assert.strictEqual(err.message, 'Protocol error, got "\\n" as reply type byte');
                    err_count++;
                }
                parser.send_error = check_error;
                parser.send_reply = check_reply;

                parser.execute(new Buffer('*1\r\n+OK\r\n\n+zasd\r\n'));
                assert.strictEqual(reply_count, 1);
                assert.strictEqual(err_count, 1);
            });

            it('should handle \\r and \\n characters properly', function () {
                // If a string contains \r or \n characters it will always be send as a bulk string
                var parser = new Parser();
                var reply_count = 0;
                var entries = ['foo\r', 'foo\r\nbar', '\r\nfoo', 'foo\r\n'];
                function check_reply (reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.strictEqual(reply, entries[reply_count]);
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('$4\r\nfoo\r\r\n$8\r\nfoo\r\nbar\r\n$5\r\n\r\n'));
                assert.strictEqual(reply_count, 2);
                parser.execute(new Buffer('foo\r\n$5\r\nfoo\r\n\r\n'));
                assert.strictEqual(reply_count, 4);
            });

            it('line breaks in the beginning of the last chunk', function () {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
                    assert.deepEqual(reply, [['a']], "Expecting multi-bulk reply of [['a']]");
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer('*1\r\n*1\r\n$1\r\na'));
                assert.equal(reply_count, 0);

                parser.execute(new Buffer('\r\n*1\r\n*1\r'));
                assert.equal(reply_count, 1);
                parser.execute(new Buffer('\n$1\r\na\r\n*1\r\n*1\r\n$1\r\na\r\n'));

                assert.equal(reply_count, 3, "check reply should have been called three times");
            });

            it('multiple chunks in a bulk string', function () {
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
            });

            it('multiple chunks with arrays different types', function () {
                var parser = new Parser();
                var reply_count = 0;
                var predefined_data = [
                    'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij',
                    'test',
                    100,
                    new Error('Error message'),
                    ['The force awakens']
                ];
                function check_reply(reply) {
                    reply = utils.reply_to_strings(reply);
                    for (var i = 0; i < reply.length; i++) {
                        if (i < 3) {
                            assert.strictEqual(reply[i], predefined_data[i]);
                        } else {
                            assert.deepEqual(reply[i], predefined_data[i]);
                        }
                    }
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
            });

            it('return normal errors', function () {
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
            });

            it('return null for empty arrays and empty bulk strings', function () {
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
            });

            it('return value even if all chunks are only 1 character long', function () {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    assert.equal(reply, 1);
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer(':'));
                assert.strictEqual(reply_count, 0);
                parser.execute(new Buffer('1'));
                assert.strictEqual(reply_count, 0);
                parser.execute(new Buffer('\r'));
                assert.strictEqual(reply_count, 0);
                parser.execute(new Buffer('\n'));
                assert.strictEqual(reply_count, 1);
            });

            it('do not return before \\r\\n', function () {
                var parser = new Parser();
                var reply_count = 0;
                function check_reply(reply) {
                    assert.equal(reply, 1);
                    reply_count++;
                }
                parser.send_reply = check_reply;

                parser.execute(new Buffer(':1\r\n:'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer('1'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer('\r'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer('\n'));
                assert.strictEqual(reply_count, 2);
            });

            it('return data as buffer if requested', function () {
                var parser = new Parser(true);
                var reply_count = 0;
                function check_reply(reply) {
                    if (Array.isArray(reply)) {
                        reply = reply[0];
                    }
                    assert(Buffer.isBuffer(reply));
                    assert.strictEqual(reply.inspect(), new Buffer('test').inspect());
                    reply_count++;
                }
                parser.send_reply = check_reply;
                parser.execute(new Buffer('+test\r\n'));
                assert.strictEqual(reply_count, 1);
                parser.execute(new Buffer('$4\r\ntest\r\n'));
                assert.strictEqual(reply_count, 2);
                parser.execute(new Buffer('*1\r\n$4\r\ntest\r\n'));
                assert.strictEqual(reply_count, 3);
            });

            it('regression test v.2.4.1', function () {
                var parser = new Parser(true);
                var reply_count = 0;
                var entries = ['test test ', 'test test test test ', '1234'];
                function check_reply(reply) {
                    assert.strictEqual(reply.toString(), entries[reply_count]);
                    reply_count++;
                }
                parser.send_reply = check_reply;
                parser.execute(new Buffer('$10\r\ntest '));
                assert.strictEqual(reply_count, 0);
                parser.execute(new Buffer('test \r\n$20\r\ntest test test test \r\n:1234\r'));
                assert.strictEqual(reply_count, 2);
                parser.execute(new Buffer('\n'));
                assert.strictEqual(reply_count, 3);
            });
        });
    });
});
