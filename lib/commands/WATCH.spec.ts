import { strict as assert } from 'assert';
import { transformArguments } from './WATCH';

describe('WATCH', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['WATCH', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['WATCH', '1', '2']
            );
        });
    });
});
