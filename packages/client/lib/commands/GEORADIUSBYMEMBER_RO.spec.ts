import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEORADIUSBYMEMBER_RO';

describe('GEORADIUSBYMEMBER_RO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member', 3 , 'm'),
            ['GEORADIUSBYMEMBER_RO', 'key', 'member', '3', 'm']
        );
    });

    testUtils.testWithClient('client.geoRadiusByMemberRo', async client => {
        assert.deepEqual(
            await client.geoRadiusByMemberRo('key',  'member', 3 , 'm'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMemberRo', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusByMemberRo('key', 'member', 3 , 'm'),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
