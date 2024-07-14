import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './HSCAN_NOVALUES';

describe('HSCAN_NOVALUES', () => {
    testUtils.isVersionGreaterThanHook([7, 4]);
    
    describe('transformArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['HSCAN', 'key', '0', 'NOVALUES']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern'
                }),
                ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'NOVALUES']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    COUNT: 1
                }),
                ['HSCAN', 'key', '0', 'COUNT', '1', 'NOVALUES']
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
                transformReply(['0', ['key1', 'key2']]),
                {
                    cursor: 0,
                    keys: ['key1', 'key2']
                }
            );
        });
    });

    testUtils.testWithClient('client.hScanNoValues', async client => {
        assert.deepEqual(
            await client.hScanNoValues('key', 0),
            {
                cursor: 0,
                keys: []
            }
        );

        await Promise.all([
            client.hSet('key', 'a', '1'),
            client.hSet('key', 'b', '2')
        ]);

        assert.deepEqual(
            await client.hScanNoValues('key', 0),
            {
                cursor: 0,
                keys: ['a', 'b']
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
