import { strict as assert } from 'assert';
import { itWithClient } from '../test-utils.js';

describe('KEYS', () => {
    itWithClient('client.keys', {}, async client => {
        assert.deepEqual(
            await client.keys('pattern'),
            []
        );
    });
});
