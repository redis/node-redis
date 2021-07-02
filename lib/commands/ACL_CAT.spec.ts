import { strict as assert } from 'assert';
import { transformArguments } from './ACL_CAT';

describe('ACL CAT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'CAT']
            );
        });

        it('with categoryName', () => {
            assert.deepEqual(
                transformArguments('dangerous'),
                ['ACL', 'CAT', 'dangerous']
            );
        });
    });
});
