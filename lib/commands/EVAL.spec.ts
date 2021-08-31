import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './EVAL';

describe('EVAL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('return KEYS[1] + ARGV[1]', {
                keys: ['key'],
                arguments: ['argument']
            }),
            ['EVAL', 'return KEYS[1] + ARGV[1]', '1', 'key', 'argument']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.eval', async client => {
        assert.equal(
            await client.eval('return 1'),
            1
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.eval', async cluster => {
        assert.equal(
            await cluster.eval('return 1'),
            1
        );
    });
});
