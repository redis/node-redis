import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZRANGEBYSCORE';

describe('ZRANGEBYSCORE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1),
                ['ZRANGEBYSCORE', 'src', '0', '1']
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
                ['ZRANGEBYSCORE', 'src', '0', '1', 'LIMIT', '0', '1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRangeByScore', async client => {
        assert.deepEqual(
            await client.zRangeByScore('src', 0, 1),
            []
        );
    });
});
