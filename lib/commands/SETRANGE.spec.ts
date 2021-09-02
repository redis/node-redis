import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './SETRANGE';

describe('SETRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 'value'),
            ['SETRANGE', 'key', '0', 'value']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.setRange', async client => {
        assert.equal(
            await client.setRange('key', 0, 'value'),
            5
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.setRange', async cluster => {
        assert.equal(
            await cluster.setRange('key', 0, 'value'),
            5
        );
    });
});
