import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './SCRIPT_FLUSH';

describe('SCRIPT FLUSH', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['SCRIPT', 'FLUSH']
            );
        });

        it('with mode', () => {
            assert.deepEqual(
                transformArguments('SYNC'),
                ['SCRIPT', 'FLUSH', 'SYNC']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.scriptFlush', async client => {
        assert.equal(
            await client.scriptFlush(),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.scriptFlush', async cluster => {
        assert.equal(
            await cluster.scriptFlush(),
            'OK'
        );
    });
});
