import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './DEL';

describe('CF DEL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['CF.DEL', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.cf.del', async client => {
        await client.cf.reserve('key', 4);

        assert.equal(
            await client.cf.del('key', 'item'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
