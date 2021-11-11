import { strict as assert } from 'assert';
import { describe } from 'mocha';
import { encodeCommand } from './commander';

function encodeCommandToString(...args: Parameters<typeof encodeCommand>): string {
    const arr = [];
    for (const item of encodeCommand(...args)) {
        arr.push(item.toString());
    }

    return arr.join('');
}

describe('Commander', () => {
    describe('encodeCommand (see #1628)', () => {
        it('1 byte', () => {
            assert.equal(
                encodeCommandToString(['a', 'z']),
                '*2\r\n$1\r\na\r\n$1\r\nz\r\n'
            );
        });

        it('2 bytes', () => {
            assert.equal(
                encodeCommandToString(['א', 'ת']),
                '*2\r\n$2\r\nא\r\n$2\r\nת\r\n'
            );
        });

        it('4 bytes', () => {
            assert.equal(
                encodeCommandToString(['🐣', '🐤']),
                '*2\r\n$4\r\n🐣\r\n$4\r\n🐤\r\n'
            );
        });

        it('with a buffer', () => {
            assert.equal(
                encodeCommandToString([Buffer.from('string')]),
                '*1\r\n$6\r\nstring\r\n'
            );
        });
    });
});
