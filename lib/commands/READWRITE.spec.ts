import { strict as assert } from 'assert';
import { transformArguments } from './READWRITE';

describe('READWRITE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['READWRITE']
        );
    });
});
