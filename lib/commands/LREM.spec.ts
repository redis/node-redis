
import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LREM';

describe('LREM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 'element'),
            ['LREM', 'key', '0', 'element']
        );
    });

    testUtils.testWithClient('client.lRem', async client => {
        assert.equal(
            await client.lRem('key', 0, 'element'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lRem', async cluster => {
        assert.equal(
            await cluster.lRem('key', 0, 'element'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
