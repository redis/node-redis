import { strict as assert } from 'node:assert';
import RedisMultiCommand, { ScriptsInUseSet } from './multi-command';
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

    it('should reuse EVALSHA across Multi instances that share scriptsInUse', () => {
      const scriptsInUse = new Set<string>();
      const first = new RedisMultiCommand(undefined, scriptsInUse);
      first.addScript(SQUARE_SCRIPT, ['1']);
      assert.deepEqual(
        Array.from(first.queue.at(-1).args),
        ['EVAL', SQUARE_SCRIPT.SCRIPT, '1', '1']
      );
      // SHA is published only after the batch would have executed.
      first.publishScriptsInUse();

      const second = new RedisMultiCommand(undefined, scriptsInUse);
      second.addScript(SQUARE_SCRIPT, ['2']);
      assert.deepEqual(
        Array.from(second.queue.at(-1).args),
        ['EVALSHA', SQUARE_SCRIPT.SHA1, '1', '2']
      );
    });

    it('should not publish SHAs from an abandoned Multi into the shared set', () => {
      const scriptsInUse = new Set<string>();
      const abandoned = new RedisMultiCommand(undefined, scriptsInUse);
      abandoned.addScript(SQUARE_SCRIPT, ['1']);

      assert.equal(scriptsInUse.has(SQUARE_SCRIPT.SHA1), false);

      const next = new RedisMultiCommand(undefined, scriptsInUse);
      next.addScript(SQUARE_SCRIPT, ['2']);
      assert.deepEqual(
        Array.from(next.queue.at(-1).args),
        ['EVAL', SQUARE_SCRIPT.SCRIPT, '1', '2']
      );
    });

    it('should clear the shared set when the batch contains SCRIPT FLUSH', () => {
      const scriptsInUse = new Set<string>([SQUARE_SCRIPT.SHA1]);
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addCommand(['SCRIPT', 'FLUSH']);
      multi.publishScriptsInUse();
      assert.equal(scriptsInUse.size, 0);
    });

    it('should EVAL again for scripts queued after SCRIPT FLUSH in the same Multi', () => {
      const scriptsInUse = new Set<string>();
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      multi.addCommand(['SCRIPT', 'FLUSH']);
      multi.addScript(SQUARE_SCRIPT, ['2']);
      assert.deepEqual(
        multi.queue.map(({ args }) => args[0]),
        ['EVAL', 'SCRIPT', 'EVAL']
      );
      multi.publishScriptsInUse();
      assert.deepEqual([...scriptsInUse], [SQUARE_SCRIPT.SHA1]);
    });

    it('should ignore inherited shared SHAs after SCRIPT FLUSH in the same Multi', () => {
      const scriptsInUse = new Set<string>([SQUARE_SCRIPT.SHA1]);
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addCommand(['SCRIPT', 'FLUSH']);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      assert.deepEqual(
        Array.from(multi.queue.at(-1).args),
        ['EVAL', SQUARE_SCRIPT.SCRIPT, '1', '1']
      );
    });

    it('invalidateScriptsOnError clears shared SHAs when the batch flushed', () => {
      const scriptsInUse = new Set<string>([SQUARE_SCRIPT.SHA1]);
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addCommand(['SCRIPT', 'FLUSH']);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      multi.invalidateScriptsOnError();
      assert.equal(scriptsInUse.size, 0);
    });

    it('should not re-add SHAs when epoch moved during the batch await', () => {
      const scriptsInUse = new ScriptsInUseSet();
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      const epochAtStart = multi.sampleEpoch();
      // Concurrent SCRIPT FLUSH while the batch is in flight.
      scriptsInUse.clear();
      multi.publishScriptsInUse(epochAtStart);
      assert.equal(scriptsInUse.has(SQUARE_SCRIPT.SHA1), false);
    });

    it('should rewrite queued EVALSHA back to EVAL after an intervening flush', () => {
      const scriptsInUse = new Set<string>([SQUARE_SCRIPT.SHA1]);
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      assert.equal(multi.queue[0].args[0], 'EVALSHA');

      scriptsInUse.clear();
      multi.revalidateQueuedScripts();

      assert.deepEqual(
        Array.from(multi.queue[0].args),
        ['EVAL', SQUARE_SCRIPT.SCRIPT, '1', '1']
      );
    });

    it('should evict SHAs for EVALSHA commands that return NOSCRIPT', () => {
      const scriptsInUse = new Set<string>([SQUARE_SCRIPT.SHA1]);
      const multi = new RedisMultiCommand(undefined, scriptsInUse);
      multi.addScript(SQUARE_SCRIPT, ['1']);
      multi.evictNoscriptShas([
        new ErrorReply('NOSCRIPT No matching script. Please use EVAL.')
      ]);
      assert.equal(scriptsInUse.has(SQUARE_SCRIPT.SHA1), false);
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
