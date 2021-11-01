import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LPUSHX';

describe('LPUSHX', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['LPUSHX', 'key', 'element']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['LPUSHX', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.lPushX', async client => {
        assert.equal(
            await client.lPushX('key', 'element'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lPushX', async cluster => {
        assert.equal(
            await cluster.lPushX('key', 'element'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
