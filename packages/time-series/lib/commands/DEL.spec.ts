import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DEL';

describe('DEL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '-', '+'),
            ['TS.DEL', 'key', '-', '+']
        );
    });

    testUtils.testWithClient('client.ts.del', async client => {
        await client.ts.create('key');

        assert.equal(
            await client.ts.del('key', '-', '+'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
