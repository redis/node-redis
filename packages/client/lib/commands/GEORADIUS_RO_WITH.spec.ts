import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisCommandArguments } from '.';
import { GeoReplyWith } from './generic-transformers';
import { transformArguments } from './GEORADIUS_RO_WITH';

describe('GEORADIUS_RO WITH', () => {
    it('transformArguments', () => {
        const expectedReply: RedisCommandArguments = ['GEORADIUS_RO', 'key', '1', '2', '3', 'm', 'WITHDIST'];
        expectedReply.preserve = ['WITHDIST'];

        assert.deepEqual(
            transformArguments('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm', [GeoReplyWith.DISTANCE]),
            expectedReply
        );
    });

    testUtils.testWithClient('client.geoRadiusRoWith', async client => {
        assert.deepEqual(
            await client.geoRadiusRoWith('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusReadOnlyWith', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusRoWith('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
