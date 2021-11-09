import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GET';

describe('GET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['GET', 'key']
        );
    });

    testUtils.testWithClient('client.get', async client => {
        assert.equal(
            await client.get('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.get', async cluster => {
        assert.equal(
            await cluster.get('key'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
