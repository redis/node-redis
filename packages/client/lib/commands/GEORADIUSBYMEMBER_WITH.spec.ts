import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisCommandArguments } from '.';
import { GeoReplyWith } from './generic-transformers';
import { transformArguments } from './GEORADIUSBYMEMBER_WITH';

describe('GEORADIUSBYMEMBER WITH', () => {
    it('transformArguments', () => {
        const expectedReply: RedisCommandArguments = ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm', 'WITHDIST'];
        expectedReply.preserve = ['WITHDIST'];

        assert.deepEqual(
            transformArguments('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            expectedReply
        );
    });

    testUtils.testWithClient('client.geoRadiusByMemberWith', async client => {
        assert.deepEqual(
            await client.geoRadiusByMemberWith('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMemberWith', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusByMemberWith('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
