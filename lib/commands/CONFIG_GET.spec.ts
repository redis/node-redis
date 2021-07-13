import { strict as assert } from 'assert';
import { transformArguments } from './CONFIG_GET';

describe('CONFIG GET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('*'),
            ['CONFIG', 'GET', '*']
        );
    });
});
