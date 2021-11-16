import { strict as assert } from 'assert';
import { transformArguments } from './DISCARD';

describe('DISCARD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['DISCARD']
        );
    });
});
