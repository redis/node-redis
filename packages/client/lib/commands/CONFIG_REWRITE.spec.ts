import { strict as assert } from 'assert';
import { transformArguments } from './CONFIG_REWRITE';

describe('CONFIG REWRITE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CONFIG', 'REWRITE']
        );
    });
});
