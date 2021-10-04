import { strict as assert } from 'assert';
import { itWithClient, itWithCluster, TestRedisClusters, TestRedisServers } from '../test-utils';
import { transformArguments } from './COMMAND_GETKEYS';

describe('COMMAND GETKEYS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['GET', 'key']),
            ['COMMAND', 'GETKEYS', 'GET', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.commandGetKeys', async client => {
        assert.deepEqual(
            await client.commandGetKeys(['GET', 'key']),
            ['key']
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.commandGetKeys', async cluster => {
        assert.deepEqual(
            await cluster.commandGetKeys(['GET', 'key']),
            ['key']
        );
    });
});
