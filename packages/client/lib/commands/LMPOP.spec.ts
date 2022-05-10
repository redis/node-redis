import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LMPOP';

describe('LMPOP', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'LEFT'),
                ['LMPOP', '1', 'key', 'LEFT']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 'LEFT', {
                    COUNT: 2
                }),
                ['LMPOP', '1', 'key', 'LEFT', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.lmPop', async client => {
        assert.deepEqual(
            await client.lmPop('key', 'RIGHT'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
