import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SETRANGE';

describe('SETRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 'value'),
            ['SETRANGE', 'key', '0', 'value']
        );
    });

    testUtils.testWithClient('client.setRange', async client => {
        assert.equal(
            await client.setRange('key', 0, 'value'),
            5
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.setRange', async cluster => {
        assert.equal(
            await cluster.setRange('key', 0, 'value'),
            5
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
