import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BLMPOP';

describe.only('BLMPOP', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(0, 'key', {
                    SIDE: 'LEFT'
                }),
                ['BLMPOP', '0', '1', 'key', 'LEFT']
            );
        });

        it('with score and count', () => {
            assert.deepEqual(
                transformArguments(0, 'key', {
                    SIDE: 'LEFT',
                    COUNT: 2
                }),
                ['BLMPOP', '0', '1', 'key', 'LEFT', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.zmScore', async client => {
        assert.deepEqual(
            await client.blmPop(0, 'key', {
                SIDE: 'LEFT'
            }),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
