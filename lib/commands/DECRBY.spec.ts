import { strict as assert } from 'assert';
import { itWithClient }  from '../test-utils.js';
import { transformArguments } from './DECRBY.js';

describe('DECRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 2),
            ['DECRBY', 'key', '2']
        );
    });

    itWithClient('client.decrBy', {}, async client => {
        assert.equal(
            await client.decrBy('key', 2),
            -2
        );
    });
});
