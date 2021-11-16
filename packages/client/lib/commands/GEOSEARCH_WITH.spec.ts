import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisCommandArguments } from '.';
import { GeoReplyWith } from './generic-transformers';
import { transformArguments } from './GEOSEARCH_WITH';

describe('GEOSEARCH WITH', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        const expectedReply: RedisCommandArguments = ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'WITHDIST'];
        expectedReply.preserve = ['WITHDIST'];

        assert.deepEqual(
            transformArguments('key', 'member', {
                radius: 1,
                unit: 'm'
            }, [GeoReplyWith.DISTANCE]),
            expectedReply
        );
    });

    testUtils.testWithClient('client.geoSearchWith', async client => {
        assert.deepEqual(
            await client.geoSearchWith('key', 'member', {
                radius: 1,
                unit: 'm'
            }, [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoSearchWith', async cluster => {
        assert.deepEqual(
            await cluster.geoSearchWith('key', 'member', {
                radius: 1,
                unit: 'm'
            }, [GeoReplyWith.DISTANCE]),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
