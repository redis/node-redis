import { strict as assert } from 'assert';
import { transformArguments } from './CLIENT_GETNAME';

describe('CLIENT GETNAME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'GETNAME']
        );
    });
});
