import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GEOSEARCHSTORE';

describe('GEOSEARCHSTORE', () => {
    it('transformArguments', () => {
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

    itWithClient(TestRedisServers.OPEN, 'client.geoSearchStore', async client => {
        assert.equal(
            await client.geoSearchStore('source', 'destination', 'member', {
                radius: 1,
                unit: 'm'
            }),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoSearchStore', async cluster => {
        assert.equal(
            await cluster.geoSearchStore('{tag}source', '{tag}destination', 'member', {
                radius: 1,
                unit: 'm'
            }),
            0
        );
    });
});
