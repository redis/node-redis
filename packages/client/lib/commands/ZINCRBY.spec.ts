import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZINCRBY';

describe('ZINCRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 'member'),
            ['ZINCRBY', 'key', '1', 'member']
        );
    });

    testUtils.testWithClient('client.zIncrBy', async client => {
        assert.equal(
            await client.zIncrBy('destination', 1, 'member'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
