import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LCS';

describe('LCS', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('1', '2'),
            ['LCS', '1', '2']
        );
    });

    testUtils.testWithClient('client.lcs', async client => {
        assert.equal(
            await client.lcs('1', '2'),
            ''
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lcs', async cluster => {
        assert.equal(
            await cluster.lcs('{tag}1', '{tag}2'),
            ''
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
