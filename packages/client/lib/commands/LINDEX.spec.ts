import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LINDEX';

describe('LINDEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['LINDEX', 'key', '0']
        );
    });

    testUtils.testWithClient('client.lIndex', async client => {
        assert.equal(
            await client.lIndex('key', 0),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lIndex', async cluster => {
        assert.equal(
            await cluster.lIndex('key', 0),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
