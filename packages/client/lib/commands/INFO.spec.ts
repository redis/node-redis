import { strict as assert } from 'node:assert';
import { transformArguments } from './INFO';

describe('INFO', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['INFO']
            );
        });

        it('server section', () => {
            assert.deepEqual(
                transformArguments('server'),
                ['INFO', 'server']
            );
        });
    });
});
