import { strict as assert } from 'assert';
import { transformArguments } from './SCANDUMP';

describe('CF SCANDUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['CF.SCANDUMP', 'key', '0']
        );
    });
});
