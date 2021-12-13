import { strict as assert } from 'assert';
import { transformArguments } from './CLIENT_GETREDIR';

describe('CLIENT GETREDIR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'GETREDIR']
        );
    });
});
