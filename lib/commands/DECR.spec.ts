import { strict as assert } from 'assert';
import { itWithClient }  from '../test-utils.js';
import { transformArguments } from './DECR.js';

describe('DECR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['DECR', 'key']
        );
    });

    itWithClient('client.decr', {}, async client => {
        assert.equal(
            await client.decr('key'),
            -1
        );
    });
});
