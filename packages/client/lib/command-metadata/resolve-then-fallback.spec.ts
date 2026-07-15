import { strict as assert } from 'node:assert';
import { defaultCommandMetadata, isReplicaSafe, isCacheable } from '.';
import type { CommandIdentifier } from '../client/parser';

// Mirrors the readers in cluster/index.ts, sentinel/utils.ts and
// client/index.ts: the predicates derive from the server flags/tips for known
// commands; anything absent from the table (user scripts/functions/unknown
// modules) falls back to the command's hardcoded field.
const id = (command: string, subcommand?: string): CommandIdentifier => ({ command, subcommand });
const replicaSafe = (i: CommandIdentifier, hardcoded?: boolean) =>
  isReplicaSafe(defaultCommandMetadata.lookup(i), hardcoded);
const cacheable = (i: CommandIdentifier, hardcoded?: boolean) =>
  isCacheable(defaultCommandMetadata.lookup(i), hardcoded);

describe('resolve-then-fallback', () => {
  describe('isReplicaSafe (derived from the write flag)', () => {
    it('keyed read (no write flag): replica-safe, derived true', () => {
      assert.equal(replicaSafe(id('get'), false), true);
    });

    it('keyed write (write flag): not replica-safe, derived false wins over a wrong hardcoded true', () => {
      assert.equal(replicaSafe(id('mset'), true), false);
    });

    it('non-data command (neither write nor readonly): replica-safe regardless of hardcoded', () => {
      // PING carries no write flag, so it is replica-safe under the !write rule.
      assert.equal(replicaSafe(id('ping'), false), true);
    });

    it('unknown command (user script/function): miss -> falls back to hardcoded', () => {
      assert.equal(defaultCommandMetadata.lookup(id('definitelynotacommand')), undefined);
      assert.equal(replicaSafe(id('definitelynotacommand'), true), true);
      assert.equal(replicaSafe(id('definitelynotacommand'), false), false);
    });
  });

  describe('isCacheable (full CSC eligibility)', () => {
    it('keyed readonly deterministic: cacheable', () => {
      assert.equal(cacheable(id('get')), true);
    });

    it('nondeterministic_output: not cacheable, derived false wins over hardcoded true (XPENDING)', () => {
      assert.equal(cacheable(id('xpending'), true), false);
    });

    it('keyless readonly: not cacheable (KEYS/RANDOMKEY are key-invalidation-unsafe)', () => {
      assert.equal(cacheable(id('keys')), false);
    });

    it('dont_cache override: not cacheable (read-only script commands, TOUCH)', () => {
      assert.equal(cacheable(id('eval_ro'), true), false);
      assert.equal(cacheable(id('touch'), true), false);
    });

    it('unknown command: miss -> falls back to hardcoded', () => {
      assert.equal(cacheable(id('definitelynotacommand'), true), true);
    });
  });
});
