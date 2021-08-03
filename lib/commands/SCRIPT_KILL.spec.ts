import { strict as assert } from 'assert';
import { transformArguments } from './SCRIPT_KILL';

describe('SCRIPT KILL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['SCRIPT', 'KILL']
        );
    });
});
