import { strict as assert } from 'assert';
import { transformArguments } from './SHUTDOWN';

describe('SHUTDOWN', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['SHUTDOWN']
            );
        }); 

        it('NOSAVE', () => {
            assert.deepEqual(
                transformArguments('NOSAVE'),
                ['SHUTDOWN', 'NOSAVE']
            );
        });

        it('SAVE', () => {
            assert.deepEqual(
                transformArguments('SAVE'),
                ['SHUTDOWN', 'SAVE']
            );
        });
    });
});
