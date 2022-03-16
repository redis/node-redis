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
                transformArguments('parameter', 'value', [['parameter2', 'value2'], ['parameter3', 'value3']]),
                ['CONFIG', 'SET', 'parameter', 'value', 'parameter2', 'value2', 'parameter3', 'value3']
            );
        });
    });
});
