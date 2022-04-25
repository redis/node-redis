import { strict as assert } from 'assert';
import BufferComposer from './buffer';

describe('Buffer Composer', () => {
    const composer = new BufferComposer();

    it('should compose two buffers', () => {
        composer.write(Buffer.from([0]));
        assert.deepEqual(
            composer.end(Buffer.from([1])),
            Buffer.from([0, 1])
        );
    });
});
