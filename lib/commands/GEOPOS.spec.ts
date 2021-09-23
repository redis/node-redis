import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments, transformReply } from './GEOPOS';

describe('GEOPOS', () => {
    describe('transformArguments', () => {
        it('single member', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['GEOPOS', 'key', 'member']
            );
        });

        it('multiple members', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['GEOPOS', 'key', '1', '2']
            );
        });
    });

    describe('transformReply', () => {
        it('null', () => {
            assert.deepEqual(
                transformReply([null]),
                [null]
            );
        });

        it('with member', () => {
            assert.deepEqual(
                transformReply([['1', '2']]),
                [{
                    longitude: '1',
                    latitude: '2'
                }]
            );
        });
    });

    describe('client.geoPos', () => {
        itWithClient(TestRedisServers.OPEN, 'null', async client => {
            assert.deepEqual(
                await client.geoPos('key', 'member'),
                [null]
            );
        });

        itWithClient(TestRedisServers.OPEN, 'with member', async client => {
            const coordinates = {
                longitude: '-122.06429868936538696',
                latitude: '37.37749628831998194'
            };

            await client.geoAdd('key', {
                member: 'member',
                ...coordinates
            });

            assert.deepEqual(
                await client.geoPos('key', 'member'),
                [coordinates]
            );
        });
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoPos', async cluster => {
        assert.deepEqual(
            await cluster.geoPos('key', 'member'),
            [null]
        );
    });
});
