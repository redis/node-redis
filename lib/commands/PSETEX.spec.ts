import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './PSETEX';

describe('PSETEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 'value'),
            ['PSETEX', 'key', '1', 'value']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.pSetEx', async client => {
        assert.equal(
            await client.pSetEx('key', 1, 'value'),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.pSetEx', async cluster => {
        assert.equal(
            await cluster.pSetEx('key', 1, 'value'),
            'OK'
        );
    });
});
