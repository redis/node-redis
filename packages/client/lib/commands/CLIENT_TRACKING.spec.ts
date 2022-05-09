import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_TRACKING';

describe('CLIENT TRACKING', () => {
    testUtils.isVersionGreaterThanHook([6]);

    describe('transformArguments', () => {
        describe('true', () => {
            it('simple', () => {
                assert.deepEqual(
                    transformArguments(true),
                    ['CLIENT', 'TRACKING', 'ON']
                );
            });

            it('with REDIRECT', () => {
                assert.deepEqual(
                    transformArguments(true, {
                        REDIRECT: 1
                    }),
                    ['CLIENT', 'TRACKING', 'ON', 'REDIRECT', '1']
                );
            });

            describe('with BCAST', () => {
                it('simple', () => {
                    assert.deepEqual(
                        transformArguments(true, {
                            BCAST: true
                        }),
                        ['CLIENT', 'TRACKING', 'ON', 'BCAST']
                    );
                });

                describe('with PREFIX', () => {
                    it('string', () => {
                        assert.deepEqual(
                            transformArguments(true, {
                                BCAST: true,
                                PREFIX: 'prefix'
                            }),
                            ['CLIENT', 'TRACKING', 'ON', 'BCAST', 'PREFIX', 'prefix']
                        );
                    });

                    it('array', () => {
                        assert.deepEqual(
                            transformArguments(true, {
                                BCAST: true,
                                PREFIX: ['1', '2']
                            }),
                            ['CLIENT', 'TRACKING', 'ON', 'BCAST', 'PREFIX', '1', 'PREFIX', '2']
                        );
                    });
                });
            });

            it('with OPTIN', () => {
                assert.deepEqual(
                    transformArguments(true, {
                        OPTIN: true
                    }),
                    ['CLIENT', 'TRACKING', 'ON', 'OPTIN']
                );
            });

            it('with OPTOUT', () => {
                assert.deepEqual(
                    transformArguments(true, {
                        OPTOUT: true
                    }),
                    ['CLIENT', 'TRACKING', 'ON', 'OPTOUT']
                );
            });

            it('with NOLOOP', () => {
                assert.deepEqual(
                    transformArguments(true, {
                        NOLOOP: true
                    }),
                    ['CLIENT', 'TRACKING', 'ON', 'NOLOOP']
                );
            });
        });

        it('false', () => {
            assert.deepEqual(
                transformArguments(false),
                ['CLIENT', 'TRACKING', 'OFF']
            );
        });
    });

    testUtils.testWithClient('client.clientTracking', async client => {
        assert.equal(
            await client.clientTracking(false),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
