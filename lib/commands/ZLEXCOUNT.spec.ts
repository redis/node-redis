import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZLEXCOUNT';

describe('ZLEXCOUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '[a', '[b'),
            ['ZLEXCOUNT', 'key', '[a', '[b']
        );
    });

    testUtils.testWithClient('client.zLexCount', async client => {
        assert.equal(
            await client.zLexCount('key', '[a', '[b'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
