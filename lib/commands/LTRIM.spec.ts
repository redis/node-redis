import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LTRIM';

describe('LTRIM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, -1),
            ['LTRIM', 'key', '0', '-1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lTrim', async client => {
        assert.equal(
            await client.lTrim('key', 0, -1),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lTrim', async cluster => {
        assert.equal(
            await cluster.lTrim('key', 0, -1),
            'OK'
        );
    });
});
