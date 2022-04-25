import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZMPOP';

describe('ZMPOP', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'MIN'),
                ['ZMPOP', '1', 'key', 'MIN']
            );
        });

        it('with score and count', () => {
            assert.deepEqual(
                transformArguments('key', 'MIN', {
                    COUNT: 2
                }),
                ['ZMPOP', '1', 'key', 'MIN', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.zmPop', async client => {
        assert.deepEqual(
            await client.zmPop('key', 'MIN'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
