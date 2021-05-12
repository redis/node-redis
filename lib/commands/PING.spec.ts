import { strict as assert } from 'assert';
import { itWithClient } from '../test-utils.js';

describe('PING', () => {
    itWithClient('client.ping', {}, async client => {
        assert.equal(
            await client.ping(),
            'PONG'
        );
    });
});
