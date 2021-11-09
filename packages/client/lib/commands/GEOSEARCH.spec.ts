import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEOSEARCH';

describe('GEOSEARCH', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member', {
                radius: 1,
                unit: 'm'
            }),
            ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm']
        );
    });

    testUtils.testWithClient('client.geoSearch', async client => {
        assert.deepEqual(
            await client.geoSearch('key', 'member', {
                radius: 1,
                unit: 'm'
            }),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoSearch', async cluster => {
        assert.deepEqual(
            await cluster.geoSearch('key', 'member', {
                radius: 1,
                unit: 'm'
            }),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
