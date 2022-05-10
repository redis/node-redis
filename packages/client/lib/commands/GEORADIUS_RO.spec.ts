import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEORADIUS_RO';

describe('GEORADIUS_RO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm'),
            ['GEORADIUS_RO', 'key', '1', '2', '3', 'm']
        );
    });

    testUtils.testWithClient('client.geoRadiusRo', async client => {
        assert.deepEqual(
            await client.geoRadiusRo('key',  {
                longitude: 1,
                latitude: 2
            }, 3 , 'm'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusRo', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusRo('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm'),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
