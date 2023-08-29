import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MSET';

describe('MSET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['1', '2'], '$', [{ a: 1 }, { b: 2 }]),
            ['JSON.MSET', '1', '$', '{ "a":"1" } ', '2', '$', '{ "b":"2"} ']
        );
    });

    testUtils.testWithClient('client.json.mGet', async client => {
        assert.deepEqual(
            await client.json.mGet(["1", "2"], "$", [{ a: 1 }, { b: 2 }]),
          [null, null]
        );
    }, GLOBAL.SERVERS.OPEN);
});
