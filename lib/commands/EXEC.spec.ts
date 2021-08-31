import { strict as assert } from 'assert';
import { transformArguments } from './EXEC';

describe('EXEC', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['EXEC']
        );
    });
});
