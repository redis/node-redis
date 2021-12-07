import { strict as assert } from 'assert';
import { transformArguments } from './CLIENT_SETNAME';

describe('CLIENT SETNAME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('name'),
            ['CLIENT', 'SETNAME', 'name']
        );
    });
});
