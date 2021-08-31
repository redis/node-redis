import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GEOPOS';

describe('GEOPOS', () => {
    describe('transformArguments', () => {
        it('single member', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['GEOPOS', 'key', 'member']
            );
        });

        it('multiple members', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['GEOPOS', 'key', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.geoPos', async client => {
        assert.deepEqual(
            await client.geoPos('key', 'member'),
            [null]
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoPos', async cluster => {
        assert.deepEqual(
            await cluster.geoPos('key', 'member'),
            [null]
        );
    });
});
