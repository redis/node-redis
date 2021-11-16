import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREMRANGEBYLEX';

describe('ZREMRANGEBYLEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '[a', '[b'),
            ['ZREMRANGEBYLEX', 'key', '[a', '[b']
        );
    });

    testUtils.testWithClient('client.zRemRangeByLex', async client => {
        assert.equal(
            await client.zRemRangeByLex('key', '[a', '[b'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
