import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SETBIT';

describe('SETBIT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['SETBIT', 'key', '0', '1']
        );
    });

    testUtils.testWithClient('client.setBit', async client => {
        assert.equal(
            await client.setBit('key', 0, 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.setBit', async cluster => {
        assert.equal(
            await cluster.setBit('key', 0, 1),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
