import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DECRBY';

describe('DECRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 2),
            ['DECRBY', 'key', '2']
        );
    });

    testUtils.testWithClient('client.decrBy', async client => {
        assert.equal(
            await client.decrBy('key', 2),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
