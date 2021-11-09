import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GETSET';

describe('GETSET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'value'),
            ['GETSET', 'key', 'value']
        );
    });

    testUtils.testWithClient('client.getSet', async client => {
        assert.equal(
            await client.getSet('key', 'value'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.getSet', async cluster => {
        assert.equal(
            await cluster.getSet('key', 'value'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
