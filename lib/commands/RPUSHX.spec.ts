import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RPUSHX';

describe('RPUSHX', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['RPUSHX', 'key', 'element']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['RPUSHX', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.rPushX', async client => {
        assert.equal(
            await client.rPushX('key', 'element'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.rPushX', async cluster => {
        assert.equal(
            await cluster.rPushX('key', 'element'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
