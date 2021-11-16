import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LLEN';

describe('LLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['LLEN', 'key']
        );
    });

    testUtils.testWithClient('client.lLen', async client => {
        assert.equal(
            await client.lLen('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lLen', async cluster => {
        assert.equal(
            await cluster.lLen('key'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
