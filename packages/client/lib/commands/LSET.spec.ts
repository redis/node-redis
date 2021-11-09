import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LSET';

describe('LSET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 'element'),
            ['LSET', 'key', '0', 'element']
        );
    });

    testUtils.testWithClient('client.lSet', async client => {
        await client.lPush('key', 'element');
        assert.equal(
            await client.lSet('key', 0, 'element'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lSet', async cluster => {
        await cluster.lPush('key', 'element');
        assert.equal(
            await cluster.lSet('key', 0, 'element'),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
