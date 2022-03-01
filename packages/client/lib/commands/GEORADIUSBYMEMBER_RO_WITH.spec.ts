import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisCommandArguments } from '.';
import { GeoReplyWith } from './generic-transformers';
import { transformArguments } from './GEORADIUSBYMEMBER_RO_WITH';

describe('GEORADIUSBYMEMBER_RO WITH', () => {
    it('transformArguments', () => {
        const expectedReply: RedisCommandArguments = ['GEORADIUSBYMEMBER_RO', 'key', 'member', '3', 'm', 'WITHDIST'];
        expectedReply.preserve = ['WITHDIST'];

        assert.deepEqual(
            transformArguments('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            expectedReply
        );
    });

    testUtils.testWithClient('client.geoRadiusByMemberReadOnlyWith', async client => {
        assert.deepEqual(
            await client.geoRadiusByMemberReadOnlyWith('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMemberReadOnlyWith', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusByMemberReadOnlyWith('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
