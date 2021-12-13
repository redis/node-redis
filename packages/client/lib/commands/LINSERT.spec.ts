import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LINSERT';

describe('LINSERT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'BEFORE', 'pivot', 'element'),
            ['LINSERT', 'key', 'BEFORE', 'pivot', 'element']
        );
    });

    testUtils.testWithClient('client.lInsert', async client => {
        assert.equal(
            await client.lInsert('key', 'BEFORE', 'pivot', 'element'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lInsert', async cluster => {
        assert.equal(
            await cluster.lInsert('key', 'BEFORE', 'pivot', 'element'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
