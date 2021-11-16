import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GETBIT';

describe('GETBIT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['GETBIT', 'key', '0']
        );
    });

    testUtils.testWithClient('client.getBit', async client => {
        assert.equal(
            await client.getBit('key', 0),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.getBit', async cluster => {
        assert.equal(
            await cluster.getBit('key', 0),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
