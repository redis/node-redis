import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BLMPOP';

describe('BLMPOP', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(0, 'key', 'LEFT'),
                ['BLMPOP', '0', '1', 'key', 'LEFT']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments(0, 'key', 'LEFT', {
                    COUNT: 2
                }),
                ['BLMPOP', '0', '1', 'key', 'LEFT', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.blmPop', async client => {
        assert.deepEqual(
            await client.blmPop(1, 'key', 'RIGHT'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
