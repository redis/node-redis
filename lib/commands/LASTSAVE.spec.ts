import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LASTSAVE';

describe('LASTSAVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['LASTSAVE']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lastSave', async client => {
        assert.ok((await client.lastSave()) instanceof Date);
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lastSave', async cluster => {
        assert.ok((await cluster.lastSave()) instanceof Date);
    });
});
