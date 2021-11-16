import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GEOADD';

describe('GEOADD', () => {
    describe('transformArguments', () => {
        it('one member', () => {
            assert.deepEqual(
                transformArguments('key', {
                    member: 'member',
                    longitude: 1,
                    latitude: 2
                }),
                ['GEOADD', 'key', '1', '2', 'member']
            );
        });

        it('multiple members', () => {
            assert.deepEqual(
                transformArguments('key', [{
                    longitude: 1,
                    latitude: 2,
                    member: '3',
                }, {
                    longitude: 4,
                    latitude: 5,
                    member: '6',
                }]),
                ['GEOADD', 'key', '1', '2', '3', '4', '5', '6']
            );
        });

        it('with NX', () => {
            assert.deepEqual(
                transformArguments('key', {
                    longitude: 1,
                    latitude: 2,
                    member: 'member'
                }, {
                    NX: true
                }),
                ['GEOADD', 'key', 'NX', '1', '2', 'member']
            );
        });

        it('with CH', () => {
            assert.deepEqual(
                transformArguments('key', {
                    longitude: 1,
                    latitude: 2,
                    member: 'member'
                }, {
                    CH: true
                }),
                ['GEOADD', 'key', 'CH', '1', '2', 'member']
            );
        });

        it('with XX, CH', () => {
            assert.deepEqual(
                transformArguments('key', {
                    longitude: 1,
                    latitude: 2,
                    member: 'member'
                }, {
                    XX: true,
                    CH: true
                }),
                ['GEOADD', 'key', 'XX', 'CH', '1', '2', 'member']
            );
        });
    });

    testUtils.testWithClient('client.geoAdd', async client => {
        assert.equal(
            await client.geoAdd('key', {
                member: 'member',
                longitude: 1,
                latitude: 2
            }),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoAdd', async cluster => {
        assert.equal(
            await cluster.geoAdd('key', {
                member: 'member',
                longitude: 1,
                latitude: 2
            }),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
