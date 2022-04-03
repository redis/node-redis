import { strict as assert } from 'assert';
import { transformArguments } from './CONFIG_SET';

describe('CONFIG SET', () => {
    describe('transformArguments', () => {
        it('set one parameter (old version)', () => {
            assert.deepEqual(
                transformArguments('parameter', 'value'),
                ['CONFIG', 'SET', 'parameter', 'value']
            );
        });

        it('set muiltiple parameters', () => {
            assert.deepEqual(
                transformArguments({
                    1: 'a',
                    2: 'b',
                    3: 'c'
                }),
                ['CONFIG', 'SET', '1', 'a', '2', 'b', '3', 'c']
            );
        });
    });
});
