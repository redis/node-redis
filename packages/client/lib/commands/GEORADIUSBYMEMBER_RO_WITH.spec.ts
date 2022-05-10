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

    testUtils.testWithClient('client.geoRadiusByMemberRoWith', async client => {
        assert.deepEqual(
            await client.geoRadiusByMemberRoWith('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMemberRoWith', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusByMemberRoWith('key', 'member', 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
