import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LINDEX';

describe('LINDEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'element'),
            ['LINDEX', 'key', 'element']
        );
    });

    testUtils.testWithClient('client.lIndex', async client => {
        assert.equal(
            await client.lIndex('key', 'element'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lIndex', async cluster => {
        assert.equal(
            await cluster.lIndex('key', 'element'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
