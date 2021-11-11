import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANGEBYSCORE_WITHSCORES';

describe('ZRANGEBYSCORE WITHSCORES', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1),
                ['ZRANGEBYSCORE', 'src', '0', '1', 'WITHSCORES']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['ZRANGEBYSCORE', 'src', '0', '1', 'LIMIT', '0', '1', 'WITHSCORES']
            );
        });
    });

    testUtils.testWithClient('client.zRangeByScoreWithScores', async client => {
        assert.deepEqual(
            await client.zRangeByScoreWithScores('src', 0, 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
