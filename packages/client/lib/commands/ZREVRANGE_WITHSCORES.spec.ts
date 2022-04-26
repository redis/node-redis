import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREVRANGE_WITHSCORES';

describe('ZREVRANGE WITHSCORES', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1),
                ['ZREVRANGE', 'src', '0', '1', 'WITHSCORES']
            );
        });
    });

    testUtils.testWithClient('client.zRevRangeWithScores', async client => {
        assert.deepEqual(
            await client.zRevRangeWithScores('src', 0, 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
