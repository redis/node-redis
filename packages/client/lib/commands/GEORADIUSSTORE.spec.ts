import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './GEORADIUSSTORE';

describe('GEORADIUSSTORE', () => {
    describe('transformArguments', () => {
        it('STORE', () => {
            assert.deepEqual(
                transformArguments('key', {longitude: 1, latitude: 2}, 3 , 'm', 'dest', {
                    SORT: 'ASC',
                    COUNT: {
                        value: 1,
                        ANY: true
                    }
                }),
                ['GEORADIUS', 'key', '1', '2', '3', 'm', 'ASC', 'COUNT', '1', 'ANY', 'STORE', 'dest']
            );
        });

        it('STOREDIST', () => {
            assert.deepEqual(
                transformArguments('key', {longitude: 1, latitude: 2}, 3 , 'm', 'dest', { STOREDIST: true }),
                ['GEORADIUS', 'key', '1', '2', '3', 'm', 'STOREDIST', 'dest']
            );
        });
    });

    testUtils.testWithClient('client.geoRadiusStore', async client => {
        await client.geoAdd('source', {
            longitude: 1,
            latitude: 1,
            member: 'member'
        });

        assert.equal(
            await client.geoRadiusStore('source', {longitude: 1, latitude: 1}, 3 , 'm', 'dest'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusStore', async cluster => {
        await cluster.geoAdd('{tag}source', {
            longitude: 1,
            latitude: 1,
            member: 'member'
        });

        assert.equal(
            await cluster.geoRadiusStore('{tag}source', {longitude: 1, latitude: 1}, 3 , 'm', '{tag}destination'),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
