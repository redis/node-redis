import { strict as assert } from 'assert';
import { transformArguments } from './EXPLAIN';

describe('EXPLAIN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('index', '*'),
            ['FT.EXPLAIN', 'index', '*']
        );
    });
});
