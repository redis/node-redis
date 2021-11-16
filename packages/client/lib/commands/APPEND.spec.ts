import { strict as assert } from 'assert';
import { transformArguments } from './APPEND';

describe('APPEND', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'value'),
            ['APPEND', 'key', 'value']
        );
    });
});
