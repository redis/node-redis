import { strict as assert } from 'assert';
import { transformArguments } from './ACL_LOG';

describe('ACL LOG', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'LOG']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments(10),
                ['ACL', 'LOG', '10']
            );
        });
    });
});
