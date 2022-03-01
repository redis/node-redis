import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEORADIUSBYMEMBER';

describe('GEORADIUSBYMEMBER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member', 3 , 'm'),
            ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm']
        );
    });

    testUtils.testWithClient('client.geoRadiusByMember', async client => {
        assert.deepEqual(
            await client.geoRadiusByMember('key',  'member', 3 , 'm'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMember', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusByMember('key', 'member', 3 , 'm'),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
