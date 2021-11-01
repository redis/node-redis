import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './ZSCAN';

describe('ZSCAN', () => {
    describe('transformArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['ZSCAN', 'key', '0']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern'
                }),
                ['ZSCAN', 'key', '0', 'MATCH', 'pattern']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    COUNT: 1
                }),
                ['ZSCAN', 'key', '0', 'COUNT', '1']
            );
        });

        it('with MATCH & COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern',
                    COUNT: 1
                }),
                ['ZSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1']
            );
        });
    });

    describe('transformReply', () => {
        it('without members', () => {
            assert.deepEqual(
                transformReply(['0', []]),
                {
                    cursor: 0,
                    members: []
                }
            );
        });

        it('with members', () => {
            assert.deepEqual(
                transformReply(['0', ['member', '-inf']]),
                {
                    cursor: 0,
                    members: [{
                        value: 'member',
                        score: -Infinity
                    }]
                }
            );
        });
    });

    testUtils.testWithClient('client.zScan', async client => {
        assert.deepEqual(
            await client.zScan('key', 0),
            {
                cursor: 0,
                members: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
