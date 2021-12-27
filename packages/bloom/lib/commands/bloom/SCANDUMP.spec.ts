import { strict as assert } from 'assert';
import { transformArguments } from './SCANDUMP';

describe('BF SCANDUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['BF.SCANDUMP', 'key', '0']
        );
    });
});
