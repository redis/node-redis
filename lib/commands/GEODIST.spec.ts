import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GEODIST';

describe('GEODIST', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', '1', '2'),
                ['GEODIST', 'key', '1', '2']
            );
        });

        it('with unit', () => {
            assert.deepEqual(
                transformArguments('key', '1', '2', 'm'),
                ['GEODIST', 'key', '1', '2', 'm']
            );
        });
    });

    describe('client.geoDist', () => {
        itWithClient(TestRedisServers.OPEN, 'null', async client => {
            assert.equal(
                await client.geoDist('key', '1', '2'),
                null
            );
        });

        itWithClient(TestRedisServers.OPEN, 'with value', async client => {
            const [, dist] = await Promise.all([
                client.geoAdd('key', [{
                    member: '1',
                    longitude: 1,
                    latitude: 1
                }, {
                    member: '2',
                    longitude: 2,
                    latitude: 2
                }]),
                client.geoDist('key', '1', '2')
            ]);

            assert.equal(
                dist,
                157270.0561
            );
        });
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoDist', async cluster => {
        assert.equal(
            await cluster.geoDist('key', '1', '2'),
            null
        );
    });
});
