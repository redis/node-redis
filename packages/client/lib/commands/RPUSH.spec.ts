import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RPUSH';

describe('RPUSH', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['RPUSH', 'key', 'element']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['RPUSH', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.rPush', async client => {
        assert.equal(
            await client.rPush('key', 'element'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.rPush', async cluster => {
        assert.equal(
            await cluster.rPush('key', 'element'),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
