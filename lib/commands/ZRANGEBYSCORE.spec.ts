import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
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

    testUtils.testWithClient('client.zRangeByScore', async client => {
        assert.deepEqual(
            await client.zRangeByScore('src', 0, 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
