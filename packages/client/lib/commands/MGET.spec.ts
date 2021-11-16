import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MGET';

describe('MGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['1', '2']),
            ['MGET', '1', '2']
        );
    });

    testUtils.testWithClient('client.mGet', async client => {
        assert.deepEqual(
            await client.mGet(['key']),
            [null]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.mGet', async cluster => {
        assert.deepEqual(
            await cluster.mGet(['key']),
            [null]
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
