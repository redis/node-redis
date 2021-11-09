import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './GEOSEARCHSTORE';

describe('GEOSEARCHSTORE', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('destination', 'source', 'member', {
                    radius: 1,
                    unit: 'm'
                }, {
                    SORT: 'ASC',
                    COUNT: {
                        value: 1,
                        ANY: true
                    }
                }),
                ['GEOSEARCHSTORE', 'destination', 'source', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'ASC', 'COUNT', '1', 'ANY']
            );
        });

        it('with STOREDIST', () => {
            assert.deepEqual(
                transformArguments('destination', 'source', 'member', {
                    radius: 1,
                    unit: 'm'
                }, {
                    SORT: 'ASC',
                    COUNT: {
                        value: 1,
                        ANY: true
                    },
                    STOREDIST: true
                }),
                ['GEOSEARCHSTORE', 'destination', 'source', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'ASC', 'COUNT', '1', 'ANY', 'STOREDIST']
            );
        });
    });

    it('transformReply with empty array (https://github.com/redis/redis/issues/9261)', () => {
        assert.throws(
            () => (transformReply as any)([]),
            TypeError
        );
    });

    testUtils.testWithClient('client.geoSearchStore', async client => {
        await client.geoAdd('source', {
            longitude: 1,
            latitude: 1,
            member: 'member'
        });

        assert.equal(
            await client.geoSearchStore('destination', 'source', 'member', {
                radius: 1,
                unit: 'm'
            }),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoSearchStore', async cluster => {
        await cluster.geoAdd('{tag}source', {
            longitude: 1,
            latitude: 1,
            member: 'member'
        });

        assert.equal(
            await cluster.geoSearchStore('{tag}destination', '{tag}source', 'member', {
                radius: 1,
                unit: 'm'
            }),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
