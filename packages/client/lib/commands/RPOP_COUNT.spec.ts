import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RPOP_COUNT';

describe('RPOP COUNT', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['RPOP', 'key', '1']
        );
    });

    testUtils.testWithClient('client.rPopCount', async client => {
        assert.equal(
            await client.rPopCount('key', 1),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.rPopCount', async cluster => {
        assert.equal(
            await cluster.rPopCount('key', 1),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
