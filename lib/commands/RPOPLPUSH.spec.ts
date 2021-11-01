import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RPOPLPUSH';

describe('RPOPLPUSH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination'),
            ['RPOPLPUSH', 'source', 'destination']
        );
    });

    testUtils.testWithClient('client.rPopLPush', async client => {
        assert.equal(
            await client.rPopLPush('source', 'destination'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.rPopLPush', async cluster => {
        assert.equal(
            await cluster.rPopLPush('{tag}source', '{tag}destination'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
