import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREMRANGEBYSCORE';

describe('ZREMRANGEBYSCORE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['ZREMRANGEBYSCORE', 'key', '0', '1']
        );
    });

    testUtils.testWithClient('client.zRemRangeByScore', async client => {
        assert.equal(
            await client.zRemRangeByScore('key', 0, 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
