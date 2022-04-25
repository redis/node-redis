import { strict as assert } from 'assert';
import StringComposer from './string';

describe('String Composer', () => {
    const composer = new StringComposer();

    it('should compose two strings', () => {
        composer.write(Buffer.from([0]));
        assert.deepEqual(
            composer.end(Buffer.from([1])),
            Buffer.from([0, 1]).toString()
        );
    });
});
