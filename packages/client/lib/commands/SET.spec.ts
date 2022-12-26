import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SET';

describe('SET', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'value'),
                ['SET', 'key', 'value']
            );
        });

        it('number', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['SET', 'key', '0']
            );
        });

        describe('TTL', () => {
            it('with EX', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        EX: 0
                    }),
                    ['SET', 'key', 'value', 'EX', '0']
                );
            });

            it('with PX', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        PX: 0
                    }),
                    ['SET', 'key', 'value', 'PX', '0']
                );
            });

            it('with EXAT', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        EXAT: 0
                    }),
                    ['SET', 'key', 'value', 'EXAT', '0']
                );
            });

            it('with PXAT', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        PXAT: 0
                    }),
                    ['SET', 'key', 'value', 'PXAT', '0']
                );
            });

            it('with KEEPTTL', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        KEEPTTL: true
                    }),
                    ['SET', 'key', 'value', 'KEEPTTL']
                );
            });
        });

        describe('Guards', () => {
            it('with NX', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        NX: true
                    }),
                    ['SET', 'key', 'value', 'NX']
                );
            });

            it('with XX', () => {
                assert.deepEqual(
                    transformArguments('key', 'value', {
                        XX: true
                    }),
                    ['SET', 'key', 'value', 'XX']
                );
            });
        });

        it('with GET', () => {
            assert.deepEqual(
                transformArguments('key', 'value', {
                    GET: true
                }),
                ['SET', 'key', 'value', 'GET']
            );
        });

        it('with EX, NX, GET', () => {
            assert.deepEqual(
                transformArguments('key', 'value', {
                    EX: 1,
                    NX: true,
                    GET: true
                }),
                ['SET', 'key', 'value', 'EX', '1', 'NX', 'GET']
            );
        });
    });

    describe('client.set', () => {
        testUtils.testWithClient('simple', async client => {
            assert.equal(
                await client.set('key', 'value'),
                'OK'
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with GET on empty key', async client => {
            assert.equal(
                await client.set('key', 'value', {
                    GET: true
                }),
                null
            );
        }, {
            ...GLOBAL.SERVERS.OPEN,
            minimumDockerVersion: [6, 2]
        });
    });
});
