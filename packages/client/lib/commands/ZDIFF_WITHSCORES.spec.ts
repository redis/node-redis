import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZDIFF_WITHSCORES';

describe('ZDIFF WITHSCORES', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZDIFF', '1', 'key', 'WITHSCORES']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZDIFF', '2', '1', '2', 'WITHSCORES']
            );
        });
    });

    testUtils.testWithClient('client.zDiffWithScores', async client => {
        assert.deepEqual(
            await client.zDiffWithScores('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
