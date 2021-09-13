import { strict as assert } from 'assert';
import RedisMultiCommand from './multi-command';
import { WatchError } from './errors';
import { spy } from 'sinon';
import { SQUARE_SCRIPT } from './client.spec';

describe('Multi Command', () => {
    describe('exec', () => {
        it('simple', async () => {
            const multi = RedisMultiCommand.create((queue, symbol) => {
                assert.deepEqual(
                    queue.map(({ args }) => args),
                    [
                        ['MULTI'],
                        ['PING'],
                        ['EXEC'],
                    ]
                );

                assert.equal(
                    typeof symbol,
                    'symbol'
                );

                return Promise.resolve(['QUEUED', 'QUEUED', ['PONG']]);
            });

            multi.ping();

            assert.deepEqual(
                await multi.exec(),
                ['PONG']
            );
        });

        it('executing an empty queue should resolve without executing on the server', async () => {
            const executor = spy();

            assert.deepEqual(
                await RedisMultiCommand.create(executor).exec(),
                []
            );

            assert.ok(executor.notCalled);
        });

        it('WatchError', () => {
            return assert.rejects(
                RedisMultiCommand.create(() => Promise.resolve([null])).ping().exec(),
                WatchError
            );
        });

        it('execAsPipeline', async () => {
            const multi = RedisMultiCommand.create(queue => {
                assert.deepEqual(
                    queue.map(({ args }) => args),
                    [['PING']]
                );

                return Promise.resolve(['PONG']);
            });

            multi.ping();

            assert.deepEqual(
                await multi.exec(true),
                ['PONG']
            );
        });
    });

    describe('execAsPipeline', () => {
        it('simple', async () => {
            const multi = RedisMultiCommand.create(queue => {
                assert.deepEqual(
                    queue.map(({ args }) => args),
                    [['PING']]
                );

                return Promise.resolve(['PONG']);
            });

            multi.ping();

            assert.deepEqual(
                await multi.execAsPipeline(),
                ['PONG']
            );
        });

        it('executing an empty queue should resolve without executing on the server', async () => {
            const executor = spy();

            assert.deepEqual(
                await RedisMultiCommand.create(executor).execAsPipeline(),
                []
            );

            assert.ok(executor.notCalled);
        });

        it('with scripts', async () => {
            const MultiWithScript = RedisMultiCommand.extend({
                scripts: {
                    square: SQUARE_SCRIPT
                }
            });

            assert.deepEqual(
                await new MultiWithScript(queue => {
                    assert.deepEqual(
                        queue.map(({ args }) => args),
                        [
                            ['EVAL', SQUARE_SCRIPT.SCRIPT, '0', '2'],
                            ['EVALSHA', SQUARE_SCRIPT.SHA1, '0', '3'],
                        ]
                    );

                    return Promise.resolve([4, 9]);
                }).square(2).square(3).execAsPipeline(),
                [4, 9]
            );
        });
    });
});
