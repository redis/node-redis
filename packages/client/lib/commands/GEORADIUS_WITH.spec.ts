import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisCommandArguments } from '.';
import { GeoReplyWith } from './generic-transformers';
import { transformArguments } from './GEORADIUS_WITH';

describe('GEORADIUS WITH', () => {
    it('transformArguments', () => {
        const expectedReply: RedisCommandArguments = ['GEORADIUS', 'key', '1', '2', '3', 'm', 'WITHDIST'];
        expectedReply.preserve = ['WITHDIST'];

        assert.deepEqual(
            transformArguments('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm', [GeoReplyWith.DISTANCE]),
            expectedReply
        );
    });

    testUtils.testWithClient('client.geoRadiusWith', async client => {
        assert.deepEqual(
            await client.geoRadiusWith('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusWith', async cluster => {
        assert.deepEqual(
            await cluster.geoRadiusWith('key', {
                longitude: 1,
                latitude: 2
            }, 3 , 'm', [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
