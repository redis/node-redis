import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HLEN';

describe('HLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HLEN', 'key']
        );
    });

    testUtils.testWithClient('client.hLen', async client => {
        assert.equal(
            await client.hLen('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
