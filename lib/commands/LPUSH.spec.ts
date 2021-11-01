import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LPUSH';

describe('LPUSH', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'field'),
                ['LPUSH', 'key', 'field']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['LPUSH', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.lPush', async client => {
        assert.equal(
            await client.lPush('key', 'field'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lPush', async cluster => {
        assert.equal(
            await cluster.lPush('key', 'field'),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
