import { strict as assert } from 'node:assert';
import RedisMultiCommand from './multi-command';
import { ErrorReply } from './errors';
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

    it('should use EVAL_RO and EVALSHA_RO for a read-only script', () => {
      const multi = new RedisMultiCommand(),
        script = {
          ...SQUARE_SCRIPT,
          IS_READ_ONLY: true
        };

      multi.addScript(script, ['1']);
      multi.addScript(script, ['2']);
      assert.deepEqual(
        multi.queue.map(({ args }) => Array.from(args)),
        [
          ['EVAL_RO', SQUARE_SCRIPT.SCRIPT, '1', '1'],
          ['EVALSHA_RO', SQUARE_SCRIPT.SHA1, '1', '2']
        ]
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

  describe('known scripts shared across batches (#2084)', () => {
    it('a later batch uses EVALSHA once an earlier batch uploaded the script', () => {
      const knownScripts = new Set<string>();

      const first = new RedisMultiCommand(undefined, knownScripts);
      first.addScript(SQUARE_SCRIPT, ['1']);
      assert.equal(first.queue[0].args[0], 'EVAL', 'first batch uploads the source');
      first.updateKnownScripts([1]);

      const second = new RedisMultiCommand(undefined, knownScripts);
      second.addScript(SQUARE_SCRIPT, ['2']);
      assert.deepEqual(
        Array.from(second.queue[0].args),
        ['EVALSHA', SQUARE_SCRIPT.SHA1, '1', '2'],
        'second batch rides the server cache'
      );
    });

    it('an EVAL whose reply is an error does not mark the script as loaded', () => {
      const knownScripts = new Set<string>();

      const multi = new RedisMultiCommand(undefined, knownScripts);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      multi.updateKnownScripts([new ErrorReply('ERR user_script error')]);

      assert.equal(knownScripts.size, 0);
    });

    it('a NOSCRIPT reply to an EVALSHA forgets the script, so the next batch re-uploads', () => {
      const knownScripts = new Set<string>([SQUARE_SCRIPT.SHA1]);

      const multi = new RedisMultiCommand(undefined, knownScripts);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      assert.equal(multi.queue[0].args[0], 'EVALSHA');
      multi.updateKnownScripts([new ErrorReply('NOSCRIPT No matching script. Please use EVAL.')]);

      assert.equal(knownScripts.size, 0, 'SCRIPT FLUSH on the server self-heals');
      const next = new RedisMultiCommand(undefined, knownScripts);
      next.addScript(SQUARE_SCRIPT, ['2']);
      assert.equal(next.queue[0].args[0], 'EVAL');
    });

    it('a non-NOSCRIPT error on an EVALSHA keeps the script marked as loaded', () => {
      const knownScripts = new Set<string>([SQUARE_SCRIPT.SHA1]);

      const multi = new RedisMultiCommand(undefined, knownScripts);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      multi.updateKnownScripts([new ErrorReply('ERR user_script error')]);

      assert.equal(knownScripts.size, 1);
    });

    it('without a shared set, batches keep the old per-batch behavior', () => {
      const multi = new RedisMultiCommand();
      multi.addScript(SQUARE_SCRIPT, ['1']);
      multi.updateKnownScripts([1]);

      const next = new RedisMultiCommand();
      next.addScript(SQUARE_SCRIPT, ['2']);
      assert.equal(next.queue[0].args[0], 'EVAL');
    });
  });
});
