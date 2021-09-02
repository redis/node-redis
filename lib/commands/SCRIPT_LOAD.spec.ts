import { strict as assert } from 'assert';
import { scriptSha1 } from '../lua-script';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './SCRIPT_LOAD';

describe('SCRIPT LOAD', () => {
    const SCRIPT = 'return 1;',
        SCRIPT_SHA1 = scriptSha1(SCRIPT);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(SCRIPT),
            ['SCRIPT', 'LOAD', SCRIPT]
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.scriptLoad', async client => {
        assert.equal(
            await client.scriptLoad(SCRIPT),
            SCRIPT_SHA1
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.scriptLoad', async cluster => {
        assert.equal(
            await cluster.scriptLoad(SCRIPT),
            SCRIPT_SHA1
        );
    });
});
