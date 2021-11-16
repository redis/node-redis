import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('DUMP', () => {
    testUtils.testWithClient('client.dump', async client => {
        assert.equal(
            await client.dump('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
