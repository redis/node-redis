import { strict as assert } from 'assert';
import RedisCommandsQueue from './commands-queue';

describe('Command Queue', () => {
    it('Command encodes correctly', () => {
	const encodeCommandInput = ["TEST"];
	const encoded = RedisCommandsQueue.encodeCommand(encodeCommandInput);
	assert(encoded == "*1\r\n$4\r\nTEST\r\n");
    });

    it('UTF-16 Byte length check (see #1628)', () => {
	const encodeCommandInput = ["\u{1f91e}"];
	const encoded = RedisCommandsQueue.encodeCommand(encodeCommandInput);
	assert.equal(encoded, "*1\r\n$4\r\n\u{1f91e}\r\n");
    }); 
});
