import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './BZPOPMAX';
import RedisClient from '../client';

describe('BZPOPMAX', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['BZPOPMAX', 'key', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments(['1', '2'], 0),
                ['BZPOPMAX', '1', '2', '0']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.bzPopMax', async client => {
        const [popReply] = await Promise.all([
            client.bzPopMax(RedisClient.commandOptions({
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
                value: '2',
                score: 2
            }
        );
    });
});
