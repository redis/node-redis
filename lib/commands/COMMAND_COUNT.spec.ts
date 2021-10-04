import { strict as assert } from 'assert';
import { itWithClient, itWithCluster, TestRedisClusters, TestRedisServers } from '../test-utils';
import { transformArguments } from './COMMAND_COUNT';

describe('COMMAND COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['COMMAND', 'COUNT']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.commandCount', async client => {
        assert.equal(
            typeof await client.commandCount(),
            'number'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.commandCount', async cluster => {
        assert.equal(
            typeof await cluster.commandCount(),
            'number'
        );
    });
});
