import { strict as assert } from 'assert';
import { transformArguments } from './CLIENT_CACHING';

describe('CLIENT CACHING', () => {
    describe('transformArguments', () => {
        it('true', () => {
            assert.deepEqual(
                transformArguments(true),
                ['CLIENT', 'CACHING', 'YES']
            );
        });

        it('false', () => {
            assert.deepEqual(
                transformArguments(false),
                ['CLIENT', 'CACHING', 'NO']
            );
        });
    });
});
