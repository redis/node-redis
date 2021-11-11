import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PERSIST';

describe('PERSIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['PERSIST', 'key']
        );
    });

    testUtils.testWithClient('client.persist', async client => {
        assert.equal(
            await client.persist('key'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
