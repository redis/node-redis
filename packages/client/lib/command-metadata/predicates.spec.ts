import { strict as assert } from 'node:assert';
import { defaultCommandMetadata, isReplicaSafe, isCacheable } from '.';
import type { CommandIdentifier } from '../client/parser';

// Mirrors the readers in cluster/index.ts, sentinel/utils.ts and
// client/index.ts: a defined override (`Command.IS_READ_ONLY` /
// `Command.CACHEABLE`, or the raw `sendCommand` isReadonly argument) always
// wins; only undeclared intent derives from the server flags/tips.
const id = (command: string, subcommand?: string): CommandIdentifier => ({ command, subcommand });
const replicaSafe = (i: CommandIdentifier, override?: boolean) =>
  isReplicaSafe(defaultCommandMetadata.lookup(i), override);
const cacheable = (i: CommandIdentifier, override?: boolean) =>
  isCacheable(defaultCommandMetadata.lookup(i), override);

describe('predicates (override-first)', () => {
  describe('isReplicaSafe', () => {
    it('keyed non-write derives replica-safe', () => {
      assert.equal(replicaSafe(id('get')), true);
      assert.equal(replicaSafe(id('json.get')), true);
    });

    it('write flag derives master-only', () => {
      assert.equal(replicaSafe(id('mset')), false);
    });

    it('explicit override wins in both directions (read-your-writes pin, deliberate replica opt-in)', () => {
      assert.equal(replicaSafe(id('get'), false), false);
      assert.equal(replicaSafe(id('shutdown'), true), true);
    });

    it('script_runner defaults to master; declared intent routes the script', () => {
      // The server cannot know whether a script writes, so EVAL/EVALSHA/FCALL
      // carry no write flag — routing must come from the declared intent
      // (defineScript IS_READ_ONLY, or the hand-set value on the _RO variants).
      assert.equal(replicaSafe(id('eval')), false);
      assert.equal(replicaSafe(id('evalsha')), false);
      assert.equal(replicaSafe(id('fcall')), false);
      assert.equal(replicaSafe(id('evalsha'), true), true);
      assert.equal(replicaSafe(id('evalsha'), false), false);
      assert.equal(replicaSafe(id('eval_ro'), true), true);
    });

    it('keyless flagless (admin/connection) defaults to master', () => {
      assert.equal(replicaSafe(id('shutdown')), false);
      assert.equal(replicaSafe(id('failover')), false);
      assert.equal(replicaSafe(id('hello')), false);
    });

    it('keyless read-ish commands opt back in via their command-definition override', () => {
      // PING.ts et al. hand-set IS_READ_ONLY: true (restored per the
      // readonly-discrepancies audit); the predicate itself derives false.
      assert.equal(replicaSafe(id('ping')), false);
      assert.equal(replicaSafe(id('ping'), true), true);
    });

    it('keyless readonly-flagged is still not replica-routed by derivation (fan-out policies route it)', () => {
      assert.equal(replicaSafe(id('keys')), false);
    });

    it('unknown command (user script/function): declared intent or master', () => {
      assert.equal(defaultCommandMetadata.lookup(id('definitelynotacommand')), undefined);
      assert.equal(replicaSafe(id('definitelynotacommand')), false);
      assert.equal(replicaSafe(id('definitelynotacommand'), true), true);
      assert.equal(replicaSafe(id('definitelynotacommand'), false), false);
    });
  });

  describe('isCacheable', () => {
    it('keyed readonly deterministic: cacheable', () => {
      assert.equal(cacheable(id('get')), true);
    });

    it('explicit override wins (TOUCH: readonly + keyed but only bumps LRU/LFU, no invalidation)', () => {
      assert.equal(cacheable(id('touch'), false), false);
      assert.equal(cacheable(id('xpending'), true), true);
    });

    it('nondeterministic_output derives not cacheable (XPENDING)', () => {
      assert.equal(cacheable(id('xpending')), false);
    });

    it('keyless readonly: not cacheable (KEYS/RANDOMKEY are key-invalidation-unsafe)', () => {
      assert.equal(cacheable(id('keys')), false);
    });

    it('script_runner: not cacheable (EVAL_RO family)', () => {
      assert.equal(cacheable(id('eval_ro')), false);
    });

    it('unknown command: declared intent or not cacheable', () => {
      assert.equal(cacheable(id('definitelynotacommand')), false);
      assert.equal(cacheable(id('definitelynotacommand'), true), true);
    });
  });
});
