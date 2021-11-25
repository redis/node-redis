import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LINDEX';
describe('LINDEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['LINDEX', 'key', '0']
        );
    });

    describe('client.lIndex', () => {
        testUtils.testWithClient('null', async client => {
            assert.equal(
                await client.lIndex('key', 0),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with value', async client => {
            const [, lIndexReply] = await Promise.all([
                client.lPush('key', 'element'),
                client.lIndex('key', 0)
            ]);

            assert.equal(lIndexReply, 'element');
        }, GLOBAL.SERVERS.OPEN);
    });

    testUtils.testWithCluster('cluster.lIndex', async cluster => {
        assert.equal(
            await cluster.lIndex('key', 0),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});