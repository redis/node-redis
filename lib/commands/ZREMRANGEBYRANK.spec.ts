import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREMRANGEBYRANK';

describe('ZREMRANGEBYRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['ZREMRANGEBYRANK', 'key', '0', '1']
        );
    });

    testUtils.testWithClient('client.zRemRangeByRank', async client => {
        assert.equal(
            await client.zRemRangeByRank('key', 0, 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
