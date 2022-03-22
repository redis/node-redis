import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LMPOP';

describe.only('LMPOP', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', {
                    SIDE: 'LEFT'
                }),
                ['LMPOP', '1', 'key', 'LEFT']
            );
        });

        it('with score and count', () => {
            assert.deepEqual(
                transformArguments('key', {
                    SIDE: 'LEFT',
                    COUNT: 2
                }),
                ['LMPOP', '1', 'key', 'LEFT', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.zmScore', async client => {
        assert.deepEqual(
            await client.lmPop('key', {
                SIDE: 'RIGHT'
            }),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
