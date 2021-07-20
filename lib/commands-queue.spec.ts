import { strict as assert } from 'assert';
import RedisCommandsQueue from './commands-queue';

describe('Command Queue', () => {
    describe('Encoding (see #1628)', () => {
        it('1 byte', () => {
            assert.equal(
                RedisCommandsQueue.encodeCommand(['a', 'z']),
                '*2\r\n$1\r\na\r\n$1\r\nz\r\n'
            );
        });

        it('2 bytes', () => {
            assert.equal(
                RedisCommandsQueue.encodeCommand(['א', 'ת']),
                '*2\r\n$2\r\nא\r\n$2\r\nת\r\n'
            );
        });

        it('4 bytes', () => {
            assert.equal(
                RedisCommandsQueue.encodeCommand(['🐣', '🐤']),
                '*2\r\n$4\r\n🐣\r\n$4\r\n🐤\r\n'
            );
        });
    });
});
