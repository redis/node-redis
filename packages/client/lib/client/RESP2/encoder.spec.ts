import { strict as assert } from 'assert';
import { describe } from 'mocha';
import encodeCommand from './encoder';

describe('RESP2 Encoder', () => {
    it('1 byte', () => {
        assert.deepEqual(
            encodeCommand(['a', 'z']),
            ['*2\r\n$1\r\na\r\n$1\r\nz\r\n']
        );
    });

    it('2 bytes', () => {
        assert.deepEqual(
            encodeCommand(['א', 'ת']),
            ['*2\r\n$2\r\nא\r\n$2\r\nת\r\n']
        );
    });

    it('4 bytes', () => {
        assert.deepEqual(
            [...encodeCommand(['🐣', '🐤'])],
            ['*2\r\n$4\r\n🐣\r\n$4\r\n🐤\r\n']
        );
    });

    it('buffer', () => {
        assert.deepEqual(
            encodeCommand([Buffer.from('string')]),
            ['*1\r\n$6\r\n', Buffer.from('string'), '\r\n']
        );
    });
});
