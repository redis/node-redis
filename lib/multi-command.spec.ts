import { strict as assert } from 'assert';
import RedisMultiCommand from './multi-command';
import { encodeCommand } from './commander';

describe('Multi Command', () => {
    it('exec', async () => {
        const multi = RedisMultiCommand.create((queue, symbol) => {
            assert.deepEqual(
                queue.map(({encodedCommand}) => encodedCommand),
                [
                    encodeCommand(['MULTI']),
                    encodeCommand(['PING']),
                    encodeCommand(['EXEC']),
                ]
            );

            assert.equal(
                typeof symbol,
                'symbol'
            )

            return Promise.resolve(['QUEUED', 'QUEUED', ['PONG']]);
        });

        multi.ping();

        assert.deepEqual(
            await multi.exec(),
            ['PONG']
        );
    });

    it('execAsPipeline', async () => {
        const multi = RedisMultiCommand.create(queue => {
            assert.deepEqual(
                queue.map(({encodedCommand}) => encodedCommand),
                [encodeCommand(['PING'])]
            );

            return Promise.resolve(['PONG']);
        });

        multi.ping();

        assert.deepEqual(
            await multi.execAsPipeline(),
            ['PONG']
        );
    });
});
