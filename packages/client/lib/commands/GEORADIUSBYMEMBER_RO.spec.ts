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

    testUtils.testWithClient('client.geoRadiusByMemberReadOnly', async client => {
        assert.deepEqual(
            await client.geoRadiusByMemberReadOnly('key',  'member', 3 , 'm'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMemberReadOnly', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusByMemberReadOnly('key', 'member', 3 , 'm'),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
