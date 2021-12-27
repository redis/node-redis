import { strict as assert } from 'assert';
import { transformArguments } from './LOADCHUNK';

describe('CF LOADCHUNK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('item', 0, ''),
            ['CF.LOADCHUNK', 'item', '0', '']
        );
    });
});
