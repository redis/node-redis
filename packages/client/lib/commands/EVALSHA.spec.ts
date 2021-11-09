import { strict as assert } from 'assert';
import { transformArguments } from './EVALSHA';

describe('EVALSHA', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('sha1', {
                keys: ['key'],
                arguments: ['argument']
            }),
            ['EVALSHA', 'sha1', '1', 'key', 'argument']
        );
    });
});
