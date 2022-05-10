import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEORADIUS';

describe('GEORADIUS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm'),
            ['GEORADIUS', 'key', '1', '2', '3', 'm']
        );
    });

    testUtils.testWithClient('client.geoRadius', async client => {
        assert.deepEqual(
            await client.geoRadius('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadius', async cluster => {
        assert.deepEqual(
            await cluster.geoRadius('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm'),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
