import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LCS_LEN';

describe('LCS_LEN', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('1', '2'),
            ['LCS', '1', '2', 'LEN']
        );
    });

    testUtils.testWithClient('client.lcsLen', async client => {
        assert.equal(
            await client.lcsLen('1', '2'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lcsLen', async cluster => {
        assert.equal(
            await cluster.lcsLen('{tag}1', '{tag}2'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
