import { strict as assert } from 'assert';
import RedisMultiCommand from './multi-command';
import RedisCommandsQueue from './commands-queue';

describe('Multi Command', () => {
    it('simple', async () => {
        const multi = RedisMultiCommand.create(queue => {
            assert.deepEqual(
                queue.map(({encodedCommand}) => encodedCommand),
                [
                    RedisCommandsQueue.encodeCommand(['MULTI']),
                    RedisCommandsQueue.encodeCommand(['PING']),
                    RedisCommandsQueue.encodeCommand(['EXEC']),
                ]
            );

            return Promise.resolve(['PONG']);
        });

        multi.ping();

        assert.deepEqual(
            await multi.exec(),
            ['PONG']
        );
    });
});
