import { strict as assert } from 'assert';
import { describe } from 'mocha';
import { encodeCommand } from './commander';

describe('Commander', () => {
    describe('encodeCommand (see #1628)', () => {
        it('1 byte', () => {
            assert.equal(
                encodeCommand(['a', 'z']),
                '*2\r\n$1\r\na\r\n$1\r\nz\r\n'
            );
        });

        it('2 bytes', () => {
            assert.equal(
                encodeCommand(['א', 'ת']),
                '*2\r\n$2\r\nא\r\n$2\r\nת\r\n'
            );
        });

        it('4 bytes', () => {
            assert.equal(
                encodeCommand(['🐣', '🐤']),
                '*2\r\n$4\r\n🐣\r\n$4\r\n🐤\r\n'
            );
        });
    });
});
