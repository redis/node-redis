import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('GET_BUFFER', () => {
    testUtils.testWithClient('client.getBuffer', async client => {
        const buffer = Buffer.from('string');
        await client.set('key', buffer);
        assert.deepEqual(
            buffer,
            await client.getBuffer('key')
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.getBuffer', async cluster => {
        const buffer = Buffer.from('string');
        await cluster.set('key', buffer);
        assert.deepEqual(
            buffer,
            await cluster.getBuffer('key')
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
