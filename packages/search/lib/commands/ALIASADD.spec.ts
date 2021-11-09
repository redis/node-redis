import { strict as assert } from 'assert';
import { transformArguments } from './ALIASADD';

describe('ALIASADD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('alias', 'index'),
            ['FT.ALIASADD', 'alias', 'index']
        );
    });
});
