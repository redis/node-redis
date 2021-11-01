import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('KEYS', () => {
    testUtils.testWithClient('client.keys', async client => {
        assert.deepEqual(
            await client.keys('pattern'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
