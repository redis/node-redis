import { strict as assert } from 'assert';
import { transformArguments } from './EVAL';

describe('EVAL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('sha1', {
                keys: ['key'],
                arguments: ['argument']
            }),
            ['EVAL', 'sha1', '1', 'key', 'argument']
        );
    });
});
