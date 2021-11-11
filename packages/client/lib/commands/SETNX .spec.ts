import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SETNX';

describe('SETNX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'value'),
            ['SETNX', 'key', 'value']
        );
    });

    testUtils.testWithClient('client.setNX', async client => {
        assert.equal(
            await client.setNX('key', 'value'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.setNX', async cluster => {
        assert.equal(
            await cluster.setNX('key', 'value'),
            true
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
