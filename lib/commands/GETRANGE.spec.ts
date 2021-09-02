import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GETRANGE';

describe('GETRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, -1),
            ['GETRANGE', 'key', '0', '-1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.getRange', async client => {
        assert.equal(
            await client.getRange('key', 0, -1),
            ''
        );
    });


    itWithCluster(TestRedisClusters.OPEN, 'cluster.lTrim', async cluster => {
        assert.equal(
            await cluster.getRange('key', 0, -1),
            ''
        );
    });
});
