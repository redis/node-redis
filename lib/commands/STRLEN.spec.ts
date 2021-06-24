import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './STRLEN';

describe('STRLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['STRLEN', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.strLen', async client => {
        assert.equal(
            await client.strLen('key'),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.strLen', async cluster => {
        assert.equal(
            await cluster.strLen('key'),
            0
        );
    });
});
