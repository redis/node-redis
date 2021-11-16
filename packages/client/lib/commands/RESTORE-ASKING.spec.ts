import { strict as assert } from 'assert';
import { transformArguments } from './RESTORE-ASKING';

describe('RESTORE-ASKING', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['RESTORE-ASKING']
        );
    });
});
