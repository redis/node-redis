import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LMOVE';

describe('LMOVE', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination', 'LEFT', 'RIGHT'),
            ['LMOVE', 'source', 'destination', 'LEFT', 'RIGHT']
        );
    });

    testUtils.testWithClient('client.lMove', async client => {
        assert.equal(
            await client.lMove('source', 'destination', 'LEFT', 'RIGHT'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lMove', async cluster => {
        assert.equal(
            await cluster.lMove('{tag}source', '{tag}destination', 'LEFT', 'RIGHT'),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
