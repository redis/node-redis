import { strict as assert } from 'assert';
import { transformArguments } from './ACL_GENPASS';

describe('ACL GENPASS', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'GENPASS']
            );
        });

        it('with bits', () => {
            assert.deepEqual(
                transformArguments(128),
                ['ACL', 'GENPASS', '128']
            );
        });
    });
});
