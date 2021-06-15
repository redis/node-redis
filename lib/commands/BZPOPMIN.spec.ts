import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './BZPOPMIN';
import RedisClient from '../client';

describe('BZPOPMIN', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['BZPOPMIN', 'key', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments(['1', '2'], 0),
                ['BZPOPMIN', '1', '2', '0']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.bzPopMin', async client => {
        const [popReply] = await Promise.all([
            client.bzPopMin(RedisClient.commandOptions({
                duplicateConnection: true
            }), 'key', 0),
            client.zAdd('key', [{
                value: '1',
                score: 1
            }, {
                value: '2',
                score: 2
            }])
        ]);

        assert.deepEqual(
            popReply,
            {
                key: 'key',
                value: '1',
                score: 1
            }
        );
    });
});
