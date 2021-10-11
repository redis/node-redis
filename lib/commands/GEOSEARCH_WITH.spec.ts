import { strict as assert } from 'assert';
import { RedisCommandArguments } from '.';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster, describeHandleMinimumRedisVersion } from '../test-utils';
import { GeoReplyWith } from './generic-transformers';
import { transformArguments } from './GEOSEARCH_WITH';

describe('GEOSEARCH WITH', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        const expectedReply: RedisCommandArguments = ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'WITHDIST']
        expectedReply.preserve = ['WITHDIST'];

        assert.deepEqual(
            transformArguments('key', 'member', {
                radius: 1,
                unit: 'm'
            }, [GeoReplyWith.DISTANCE]),
            expectedReply
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.geoSearchWith', async client => {
        assert.deepEqual(
            await client.geoSearchWith('key', 'member', {
                radius: 1,
                unit: 'm'
            }, [GeoReplyWith.DISTANCE]),
            []
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoSearchWith', async cluster => {
        assert.deepEqual(
            await cluster.geoSearchWith('key', 'member', {
                radius: 1,
                unit: 'm'
            }, [GeoReplyWith.DISTANCE]),
            []
        );
    });
});
