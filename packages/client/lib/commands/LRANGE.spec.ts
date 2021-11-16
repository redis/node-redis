
import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LRANGE';

describe('LRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, -1),
            ['LRANGE', 'key', '0', '-1']
        );
    });

    testUtils.testWithClient('client.lRange', async client => {
        assert.deepEqual(
            await client.lRange('key', 0, -1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lRange', async cluster => {
        assert.deepEqual(
            await cluster.lRange('key', 0, -1),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
