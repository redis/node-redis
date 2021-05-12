import { strict as assert } from 'assert';
import RedisMultiCommand, { MultiQueuedCommand } from './multi-command';
import RedisClient from './client';

describe('Multi Command', () => {
    it('create', async () => {
        const multi = RedisMultiCommand.create(async (encodedCommands: Array<MultiQueuedCommand>): Promise<Array<string>> => {
            return Object.keys(encodedCommands);
        });

        multi.ping();
        multi.set('a', 'b');
        // console.log(
        await multi.exec()
        // );
    });

    it('client.multi', async () => {
        const client = RedisClient.create();

        await client.connect();

        assert.deepEqual(
            await client
                .multi()
                .ping()
                .set('key', 'value')
                .exec(),
            ['PONG', 'OK']
        );

        await client.disconnect();
    });
});
