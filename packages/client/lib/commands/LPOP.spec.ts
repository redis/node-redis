import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LPOP';

describe('LPOP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['LPOP', 'key']
        );
    });

    testUtils.testWithClient('client.lPop', async client => {
        assert.equal(
            await client.lPop('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lPop', async cluster => {
        assert.equal(
            await cluster.lPop('key'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
