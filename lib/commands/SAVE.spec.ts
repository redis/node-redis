import { strict as assert } from 'assert';
import { transformArguments } from './SAVE';

describe('SAVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['SAVE']
        );
    });
});
