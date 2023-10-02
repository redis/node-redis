import { strict as assert } from 'node:assert';
import RedisMultiCommand from './multi-command';
import { SQUARE_SCRIPT } from './client/index.spec';

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
