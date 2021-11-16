import { strict as assert } from 'assert';
import { transformArguments } from './ALIASUPDATE';

describe('ALIASUPDATE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('alias', 'index'),
            ['FT.ALIASUPDATE', 'alias', 'index']
        );
    });
});
