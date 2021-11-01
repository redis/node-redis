import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEOHASH';

describe('GEOHASH', () => {
    describe('transformArguments', () => {
        it('single member', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['GEOHASH', 'key', 'member']
            );
        });

        it('multiple members', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['GEOHASH', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.geoHash', async client => {
        assert.deepEqual(
            await client.geoHash('key', 'member'),
            [null]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoHash', async cluster => {
        assert.deepEqual(
            await cluster.geoHash('key', 'member'),
            [null]
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
