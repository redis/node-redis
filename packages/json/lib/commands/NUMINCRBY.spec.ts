import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './NUMINCRBY';

describe('NUMINCRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '$', 1),
            ['JSON.NUMINCRBY', 'key', '$', '1']
        );
    });

    testUtils.testWithClient('client.json.numIncrBy', async client => {
        await client.json.set('key', '$', 0);

        assert.deepEqual(
            await client.json.numIncrBy('key', '$', 1),
            [1]
        );
    }, GLOBAL.SERVERS.OPEN);
});
