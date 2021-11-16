import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MGET';

describe('MGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['1', '2'], '$'),
            ['JSON.MGET', '1', '2', '$']
        );
    });

    testUtils.testWithClient('client.json.mGet', async client => {
        assert.deepEqual(
            await client.json.mGet(['1', '2'], '$'),
            [null, null]
        );
    }, GLOBAL.SERVERS.OPEN);
});
