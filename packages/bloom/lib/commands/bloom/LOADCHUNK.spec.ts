import { strict as assert } from 'assert';
import { transformArguments } from './LOADCHUNK';

describe('BF LOADCHUNK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, ''),
            ['BF.LOADCHUNK', 'key', '0', '']
        );
    });
});
