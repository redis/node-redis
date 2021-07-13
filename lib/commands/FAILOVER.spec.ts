import { strict as assert } from 'assert';
import { transformArguments } from './FAILOVER';

describe('FAILOVER', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['FAILOVER']
            );
        });

        describe('with TO', () => {
            it('simple', () => {
                assert.deepEqual(
                    transformArguments({
                        TO: {
                            host: 'host',
                            port: 6379
                        }
                    }),
                    ['FAILOVER', 'TO', 'host', '6379']
                );
            });

            it('with FORCE', () => {
                assert.deepEqual(
                    transformArguments({
                        TO: {
                            host: 'host',
                            port: 6379,
                            FORCE: true
                        }
                    }),
                    ['FAILOVER', 'TO', 'host', '6379', 'FORCE']
                );
            });
        });

        it('with ABORT', () => {
            assert.deepEqual(
                transformArguments({
                    ABORT: true
                }),
                ['FAILOVER', 'ABORT']
            );
        });

        it('with TIMEOUT', () => {
            assert.deepEqual(
                transformArguments({
                    TIMEOUT: 1
                }),
                ['FAILOVER', 'TIMEOUT', '1']
            );
        });

        it('with TO, ABORT, TIMEOUT', () => {
            assert.deepEqual(
                transformArguments({
                    TO: {
                        host: 'host',
                        port: 6379
                    },
                    ABORT: true,
                    TIMEOUT: 1
                }),
                ['FAILOVER', 'TO', 'host', '6379', 'ABORT', 'TIMEOUT', '1']
            );
        });
    });
});
