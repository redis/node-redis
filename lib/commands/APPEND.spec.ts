import { strict as assert } from 'assert';
import { transformArguments } from './APPEND.js';

describe('AUTH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'value'),
            ['APPEND', 'key', 'value']
        );
    });
});
