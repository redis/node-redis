import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './HSCAN_VALUES';

describe('HSCAN_VALUES', () => {
    describe('transformArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['HSCAN', 'key', '0', 'VALUES']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern'
                }),
                ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'VALUES']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    COUNT: 1
                }),
                ['HSCAN', 'key', '0', 'COUNT', '1', 'VALUES']
            );
        });

        it('with MATCH & COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern',
                    COUNT: 1
                }),
                ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1', 'VALUES']
            );
        });
    });

    describe('transformReply', () => {
        it('without tuples', () => {
            assert.deepEqual(
                transformReply(['0', []]),
                {
                    cursor: 0,
                    fields: []
                }
            );
        });

        it('with tuples', () => {
            assert.deepEqual(
                transformReply(['0', ['field']]),
                {
                    cursor: 0,
                    fields: [
                        'field',
                    ]
                }
            );
        });
    });

    testUtils.testWithClient('client.hScan', async client => {
        assert.deepEqual(
            await client.hScanValues('key', 0),
            {
                cursor: 0,
                fields: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
