import { strict as assert } from 'assert';
import { transformArguments } from './MODULE_LOAD';

describe('MODULE LOAD', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('path'),
                ['MODULE', 'LOAD', 'path']
            );
        });

        it('with module args', () => {
            assert.deepEqual(
                transformArguments('path', ['1', '2']),
                ['MODULE', 'LOAD', 'path', '1', '2']
            );
        });
    });
});
