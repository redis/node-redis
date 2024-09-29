import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './HSCAN';

describe('HSCAN', () => {
    describe('transformArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['HSCAN', 'key', '0']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern'
                }),
                ['HSCAN', 'key', '0', 'MATCH', 'pattern']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    COUNT: 1
                }),
                ['HSCAN', 'key', '0', 'COUNT', '1']
            );
        });

        it('with MATCH & COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern',
                    COUNT: 1
                }),
                ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1']
            );
        });
    });

    describe('transformReply', () => {
        it('without tuples', () => {
            assert.deepEqual(
                transformReply(['0', []]),
                {
                    cursor: 0,
                    tuples: []
                }
            );
        });

        it('with tuples', () => {
            assert.deepEqual(
                transformReply(['0', ['field', 'value']]),
                {
                    cursor: 0,
                    tuples: [{
                        field: 'field',
                        value: 'value'
                    }]
                }
            );
        });
    });

    testUtils.testWithClient('client.hScan', async client => {
        assert.deepEqual(
            await client.hScan('key', 0),
            {
                cursor: 0,
                tuples: []
            }
        );

        await Promise.all([
            client.hSet('key', 'a', '1'),
            client.hSet('key', 'b', '2')
        ]);

        assert.deepEqual(
            await client.hScan('key', 0),
            {
                cursor: 0,
                tuples: [{field: 'a', value: '1'}, {field: 'b', value: '2'}]
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
