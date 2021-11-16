import { strict as assert } from 'assert';
import { transformArguments } from './ASKING';

describe('ASKING', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ASKING']
        );
    });
});
