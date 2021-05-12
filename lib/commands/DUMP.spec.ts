import { strict as assert } from 'assert';
import { itWithClient } from '../test-utils.js';

describe('DUMP', () => {
    itWithClient('client.dump', {}, async client => {
        assert.equal(
            await client.dump('key'),
            null
        );
    });
});
