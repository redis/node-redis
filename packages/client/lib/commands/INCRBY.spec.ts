import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './INCRBY';

describe('INCR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['INCRBY', 'key', '1']
        );
    });

    testUtils.testWithClient('client.incrBy', async client => {
        assert.equal(
            await client.incrBy('key', 1),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
