import { strict as assert } from 'node:assert';
import RedisMultiCommand from './multi-command';
import { defineScript } from './lua-script';
import { CommandParser } from './client/parser';
import { NumberReply } from './RESP/types';

const SQUARE_SCRIPT = defineScript({
  SCRIPT:
    `local number = redis.call('GET', KEYS[1])
    return number * number`,
  NUMBER_OF_KEYS: 1,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
});

const READ_ONLY_SCRIPT = defineScript({
  SCRIPT: `return redis.call('GET', KEYS[1])`,
  NUMBER_OF_KEYS: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => string
});

describe('Multi Command', () => {
  it('addCommand', () => {
    const multi = new RedisMultiCommand();
    multi.addCommand(['PING']);

    assert.deepEqual(
      multi.queue[0].args,
      ['PING']
    );
  });

  describe('addScript', () => {
    const multi = new RedisMultiCommand();

    it('should use EVAL', () => {
      multi.addScript(SQUARE_SCRIPT, ['1']);
      assert.deepEqual(
        Array.from(multi.queue.at(-1).args),
        ['EVAL', SQUARE_SCRIPT.SCRIPT, '1', '1']
      );
    });

    it('should use EVALSHA', () => {
      multi.addScript(SQUARE_SCRIPT, ['2']);
      assert.deepEqual(
        Array.from(multi.queue.at(-1).args),
        ['EVALSHA', SQUARE_SCRIPT.SHA1, '1', '2']
      );
    });

    it('without NUMBER_OF_KEYS', () => {
      multi.addScript({
        ...SQUARE_SCRIPT,
        NUMBER_OF_KEYS: undefined
      }, ['2']);
      assert.deepEqual(
        Array.from(multi.queue.at(-1).args),
        ['EVALSHA', SQUARE_SCRIPT.SHA1, '2']
      );
    });

    it('should use EVAL_RO for read-only scripts', () => {
      const readOnlyMulti = new RedisMultiCommand();
      readOnlyMulti.addScript(READ_ONLY_SCRIPT, ['k']);
      assert.deepEqual(
        Array.from(readOnlyMulti.queue.at(-1).args),
        ['EVAL_RO', READ_ONLY_SCRIPT.SCRIPT, '1', 'k']
      );
    });

    it('should use EVALSHA_RO for cached read-only scripts', () => {
      const readOnlyMulti = new RedisMultiCommand();
      readOnlyMulti.addScript(READ_ONLY_SCRIPT, ['k1']);
      readOnlyMulti.addScript(READ_ONLY_SCRIPT, ['k2']);
      assert.deepEqual(
        Array.from(readOnlyMulti.queue.at(-1).args),
        ['EVALSHA_RO', READ_ONLY_SCRIPT.SHA1, '1', 'k2']
      );
    });
  });

  describe('exec', () => {
    it('without commands', () => {
      assert.deepEqual(
        new RedisMultiCommand().queue,
        []
      );
    });

    it('with commands', () => {
      const multi = new RedisMultiCommand();
      multi.addCommand(['PING']);

      assert.deepEqual(
        multi.queue,
        [{
          args: ['PING'],
          transformReply: undefined
        }]
      );
    });
  });

  it('transformReplies', () => {
    const multi = new RedisMultiCommand();
    multi.addCommand(['PING'], (reply: string) => reply.substring(0, 2));
    assert.deepEqual(
      multi.transformReplies(['PONG']),
      ['PO']
    );
  });
});
