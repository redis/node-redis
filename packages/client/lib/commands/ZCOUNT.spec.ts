import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZCOUNT';

describe('ZCOUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['ZCOUNT', 'key', '0', '1']
        );
    });

    testUtils.testWithClient('client.zCount', async client => {
        assert.equal(
            await client.zCount('key', 0, 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
