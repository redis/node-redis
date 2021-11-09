import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GETRANGE';

describe('GETRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, -1),
            ['GETRANGE', 'key', '0', '-1']
        );
    });

    testUtils.testWithClient('client.getRange', async client => {
        assert.equal(
            await client.getRange('key', 0, -1),
            ''
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lTrim', async cluster => {
        assert.equal(
            await cluster.getRange('key', 0, -1),
            ''
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
