import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LPOP_COUNT';

describe('LPOP COUNT', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['LPOP', 'key', '1']
        );
    });

    testUtils.testWithClient('client.lPopCount', async client => {
        assert.equal(
            await client.lPopCount('key', 1),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lPopCount', async cluster => {
        assert.equal(
            await cluster.lPopCount('key', 1),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
