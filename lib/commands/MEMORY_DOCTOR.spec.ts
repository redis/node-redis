import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './MEMORY_DOCTOR';

describe('MEMORY DOCTOR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MEMORY', 'DOCTOR']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.memoryDoctor', async client => {
        assert.equal(
            typeof (await client.memoryDoctor()),
            'string'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.memoryDoctor', async cluster => {
        assert.equal(
            typeof (await cluster.memoryDoctor()),
            'string'
        );
    });
});
