import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './SCRIPT_EXISTS';

describe('SCRIPT EXISTS', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('sha1'),
                ['SCRIPT', 'EXISTS', 'sha1']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['SCRIPT', 'EXISTS', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.scriptExists', async client => {
        assert.deepEqual(
            await client.scriptExists('sha1'),
            [false]
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.scriptExists', async cluster => {
        assert.deepEqual(
            await cluster.scriptExists('sha1'),
            [false]
        );
    });
});
