import { strict as assert } from 'assert';
import { transformArguments } from './READONLY';

describe('READONLY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['READONLY']
        );
    });
});
