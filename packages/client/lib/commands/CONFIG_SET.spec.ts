import { strict as assert } from 'assert';
import { transformArguments } from './CONFIG_SET';

describe('CONFIG SET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('parameter', 'value'),
            ['CONFIG', 'SET', 'parameter', 'value']
        );
    });
});
