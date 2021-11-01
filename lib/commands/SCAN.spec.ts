import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './SCAN';

describe('SCAN', () => {
    describe('transformArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                transformArguments(0),
                ['SCAN', '0']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                transformArguments(0, {
                    MATCH: 'pattern'
                }),
                ['SCAN', '0', 'MATCH', 'pattern']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments(0, {
                    COUNT: 1
                }),
                ['SCAN', '0', 'COUNT', '1']
            );
        });

        it('with TYPE', () => {
            assert.deepEqual(
                transformArguments(0, {
                    TYPE: 'stream'
                }),
                ['SCAN', '0', 'TYPE', 'stream']
            );
        });

        it('with MATCH & COUNT & TYPE', () => {
            assert.deepEqual(
                transformArguments(0, {
                    MATCH: 'pattern',
                    COUNT: 1,
                    TYPE: 'stream'
                }),
                ['SCAN', '0', 'MATCH', 'pattern', 'COUNT', '1', 'TYPE', 'stream']
            );
        });
    });

    describe('transformReply', () => {
        it('without keys', () => {
            assert.deepEqual(
                transformReply(['0', []]),
                {
                    cursor: 0,
                    keys: []
                }
            );
        });

        it('with keys', () => {
            assert.deepEqual(
                transformReply(['0', ['key']]),
                {
                    cursor: 0,
                    keys: ['key']
                }
            );
        });
    });

    testUtils.testWithClient('client.scan', async client => {
        assert.deepEqual(
            await client.scan(0),
            {
                cursor: 0,
                keys: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
