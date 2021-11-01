import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './SSCAN';

describe('SSCAN', () => {
    describe('transformArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['SSCAN', 'key', '0']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern'
                }),
                ['SSCAN', 'key', '0', 'MATCH', 'pattern']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    COUNT: 1
                }),
                ['SSCAN', 'key', '0', 'COUNT', '1']
            );
        });

        it('with MATCH & COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, {
                    MATCH: 'pattern',
                    COUNT: 1
                }),
                ['SSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1']
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
                transformReply(['0', ['member']]),
                {
                    cursor: 0,
                    members: ['member']
                }
            );
        });
    });

    testUtils.testWithClient('client.sScan', async client => {
        assert.deepEqual(
            await client.sScan('key', 0),
            {
                cursor: 0,
                members: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
