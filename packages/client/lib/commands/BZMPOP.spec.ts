import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BZMPOP';

describe.only('BZMPOP', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(0, 'key', {
                    SCORE: 'MIN'
                }),
                ['BZMPOP', '0', '1', 'key', 'MIN']
            );
        });

        it('with score and count', () => {
            assert.deepEqual(
                transformArguments(0, 'key', {
                    SCORE: 'MIN',
                    COUNT: 2
                }),
                ['BZMPOP', '0', '1', 'key', 'MIN', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.zmScore', async client => {
        assert.deepEqual(
            await client.bzmPop(0, 'key', {
                SCORE: 'MAX'
            }),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
