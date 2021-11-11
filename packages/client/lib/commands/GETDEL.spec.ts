import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GETDEL';

describe('GETDEL', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['GETDEL', 'key']
        );
    });

    testUtils.testWithClient('client.getDel', async client => {
        assert.equal(
            await client.getDel('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.getDel', async cluster => {
        assert.equal(
            await cluster.getDel('key'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
