import { strict as assert } from 'assert';
import { transformArguments } from './ALIASDEL';

describe('ALIASDEL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('alias', 'index'),
            ['FT.ALIASDEL', 'alias', 'index']
        );
    });
});
