import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZDIFF';

describe('ZDIFF', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZDIFF', '1', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZDIFF', '2', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.zDiff', async client => {
        assert.deepEqual(
            await client.zDiff('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
