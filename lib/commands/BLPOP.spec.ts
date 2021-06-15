import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './BLPOP';
import RedisClient from '../client';

describe('BLPOP', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['BLPOP', 'key', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments(['key1', 'key2'], 0),
                ['BLPOP', 'key1', 'key2', '0']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.blPop', async client => {
        const [popReply] = await Promise.all([
            client.blPop(RedisClient.commandOptions({
                duplicateConnection: true
            }), 'key', 0),
            client.lPush('key', ['1', '2'])
        ]);

        assert.deepEqual(
            popReply,
            ['key', '2']
        );
    });
});
