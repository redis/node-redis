import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RPOP';

describe('RPOP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['RPOP', 'key']
        );
    });

    testUtils.testWithClient('client.rPop', async client => {
        assert.equal(
            await client.rPop('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.rPop', async cluster => {
        assert.equal(
            await cluster.rPop('key'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
