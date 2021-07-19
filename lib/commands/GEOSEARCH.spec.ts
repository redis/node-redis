import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './GEOSEARCH';

describe('GEOSEARCH', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member', {
                radius: 1,
                unit: 'm'
            }),
            ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.geoSearch', async client => {
        assert.deepEqual(
            await client.geoSearch('key', 'member', {
                radius: 1,
                unit: 'm'
            }),
            []
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoSearch', async cluster => {
        assert.deepEqual(
            await cluster.geoSearch('key', 'member', {
                radius: 1,
                unit: 'm'
            }),
            []
        );
    });
});
