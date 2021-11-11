import { strict as assert } from 'assert';
import { transformArguments } from './BGREWRITEAOF';

describe('BGREWRITEAOF', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['BGREWRITEAOF']
        );
    });
});
