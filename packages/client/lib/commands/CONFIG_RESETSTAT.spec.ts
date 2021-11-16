import { strict as assert } from 'assert';
import { transformArguments } from './CONFIG_RESETSTAT';

describe('CONFIG RESETSTAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CONFIG', 'RESETSTAT']
        );
    });
});
