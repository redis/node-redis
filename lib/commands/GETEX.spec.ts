import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GETEX';

describe('GETEX', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('EX', () => {
            assert.deepEqual(
                transformArguments('key', {
                    EX: 1
                }),
                ['GETEX', 'key', 'EX', '1']
            );
        });

        it('PX', () => {
            assert.deepEqual(
                transformArguments('key', {
                    PX: 1
                }),
                ['GETEX', 'key', 'PX', '1']
            );
        });

        describe('EXAT', () => {
            it('number', () => {
                assert.deepEqual(
                    transformArguments('key', {
                        EXAT: 1
                    }),
                    ['GETEX', 'key', 'EXAT', '1']
                );
            });

            it('date', () => {
                const d = new Date();
                assert.deepEqual(
                    transformArguments('key', {
                        EXAT: d
                    }),
                    ['GETEX', 'key', 'EXAT', Math.floor(d.getTime() / 1000).toString()]
                );
            });
        });

        describe('PXAT', () => {
            it('number', () => {
                assert.deepEqual(
                    transformArguments('key', {
                        PXAT: 1
                    }),
                    ['GETEX', 'key', 'PXAT', '1']
                );
            });

            it('date', () => {
                const d = new Date();
                assert.deepEqual(
                    transformArguments('key', {
                        PXAT: d
                    }),
                    ['GETEX', 'key', 'PXAT', d.getTime().toString()]
                );
            });
        });

        it('PERSIST', () => {
            assert.deepEqual(
                transformArguments('key', {
                    PERSIST: true
                }),
                ['GETEX', 'key', 'PERSIST']
            );
        });
    });

    testUtils.testWithClient('client.getEx', async client => {
        assert.equal(
            await client.getEx('key', {
                PERSIST: true
            }),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.getEx', async cluster => {
        assert.equal(
            await cluster.getEx('key', {
                PERSIST: true
            }),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
