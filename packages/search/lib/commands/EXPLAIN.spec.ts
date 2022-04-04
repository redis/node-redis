import { strict as assert } from 'assert';
import { transformArguments } from './EXPLAIN';

describe('EXPLAIN', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('index', '*'),
                ['FT.EXPLAIN', 'index', '*']
            );
        });

        it('with PARAMS', () => {
            assert.deepEqual(
                transformArguments('index', '*', {
                    PARAMS: {
                        param: 'value'
                    }
                }),
                ['FT.EXPLAIN', 'index', '*', 'PARAMS', '2', 'param', 'value']
            );
        });

        it('with DIALECT', () => {
            assert.deepEqual(
                transformArguments('index', '*', {
                    DIALECT: 1
                }),
                ['FT.EXPLAIN', 'index', '*', 'DIALECT', '1']
            );
        });
    });
});
