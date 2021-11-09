import { strict as assert } from 'assert';
import { transformArguments } from './EXPLAINCLI';

describe('EXPLAINCLI', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('index', '*'),
            ['FT.EXPLAINCLI', 'index', '*']
        );
    });
});
