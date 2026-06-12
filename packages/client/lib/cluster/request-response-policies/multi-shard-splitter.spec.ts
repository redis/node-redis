import { strict as assert } from 'node:assert';
import calculateSlot from 'cluster-key-slot';
import type { KeySpec } from '../../commands/generic-transformers';
import { splitMultiShardCommand } from './multi-shard-splitter';

// Real specs of the 7 multi_shard commands (Redis 8.8.0).
const RANGE_STEP_1: Array<KeySpec> = [{
  beginSearch: { type: 'index', index: 1 },
  findKeys: { type: 'range', lastKey: -1, keyStep: 1, limit: 0 }
}];
const RANGE_STEP_2: Array<KeySpec> = [{
  beginSearch: { type: 'index', index: 1 },
  findKeys: { type: 'range', lastKey: -1, keyStep: 2, limit: 0 }
}];
const KEYNUM_STEP_2: Array<KeySpec> = [{
  beginSearch: { type: 'index', index: 1 },
  findKeys: { type: 'keynum', keyNumIdx: 0, firstKey: 1, keyStep: 2 }
}];

// Hash tags pin keys to slots: {a}* keys share a slot, {b}* keys share
// a different one.
const SLOT_A = calculateSlot('{a}1');
const SLOT_B = calculateSlot('{b}1');

describe('splitMultiShardCommand', () => {
  before(() => assert.notEqual(SLOT_A, SLOT_B));

  it('single-slot fast path returns the original args', () => {
    const args = ['DEL', '{a}1', '{a}2', '{a}3'];
    const result = splitMultiShardCommand(args, RANGE_STEP_1);

    assert.equal(result.size, 1);
    assert.deepEqual(result.get(SLOT_A), {
      args: ['DEL', '{a}1', '{a}2', '{a}3'],
      groupIndices: [0, 1, 2]
    });
  });

  it('splits DEL per slot (range, keystep 1)', () => {
    const result = splitMultiShardCommand(['DEL', '{a}1', '{b}1', '{a}2'], RANGE_STEP_1);

    assert.equal(result.size, 2);
    assert.deepEqual(result.get(SLOT_A), {
      args: ['DEL', '{a}1', '{a}2'],
      groupIndices: [0, 2]
    });
    assert.deepEqual(result.get(SLOT_B), {
      args: ['DEL', '{b}1'],
      groupIndices: [1]
    });
  });

  it('splits MSET keeping values with their keys (range, keystep 2)', () => {
    const result = splitMultiShardCommand(
      ['MSET', '{a}1', 'v1', '{b}1', 'v2', '{a}2', 'v3'],
      RANGE_STEP_2
    );

    assert.equal(result.size, 2);
    assert.deepEqual(result.get(SLOT_A), {
      args: ['MSET', '{a}1', 'v1', '{a}2', 'v3'],
      groupIndices: [0, 2]
    });
    assert.deepEqual(result.get(SLOT_B), {
      args: ['MSET', '{b}1', 'v2'],
      groupIndices: [1]
    });
  });

  it('splits MSETEX rewriting numkeys and copying the options suffix', () => {
    const result = splitMultiShardCommand(
      ['MSETEX', '3', '{a}1', 'v1', '{b}1', 'v2', '{a}2', 'v3', 'NX', 'EX', '10'],
      KEYNUM_STEP_2
    );

    assert.equal(result.size, 2);
    assert.deepEqual(result.get(SLOT_A), {
      args: ['MSETEX', '2', '{a}1', 'v1', '{a}2', 'v3', 'NX', 'EX', '10'],
      groupIndices: [0, 2]
    });
    assert.deepEqual(result.get(SLOT_B), {
      args: ['MSETEX', '1', '{b}1', 'v2', 'NX', 'EX', '10'],
      groupIndices: [1]
    });
  });

  it('keynum single-slot fast path keeps original numkeys', () => {
    const args = ['MSETEX', '2', '{a}1', 'v1', '{a}2', 'v2', 'KEEPTTL'];
    const result = splitMultiShardCommand(args, KEYNUM_STEP_2);

    assert.equal(result.size, 1);
    assert.deepEqual(result.get(SLOT_A)?.args, args);
  });

  it('records interleaved group indices for order-preserving reassembly (MGET)', () => {
    const result = splitMultiShardCommand(
      ['MGET', '{a}1', '{b}1', '{a}2', '{b}2'],
      RANGE_STEP_1
    );

    assert.deepEqual(result.get(SLOT_A)?.groupIndices, [0, 2]);
    assert.deepEqual(result.get(SLOT_B)?.groupIndices, [1, 3]);
  });

  it('handles Buffer keys', () => {
    const result = splitMultiShardCommand(
      ['MGET', Buffer.from('{a}1'), '{b}1'],
      RANGE_STEP_1
    );

    assert.equal(result.size, 2);
    assert.deepEqual(result.get(SLOT_A)?.args, ['MGET', Buffer.from('{a}1')]);
  });

  describe('guardrails', () => {
    const args = ['DEL', '{a}1', '{b}1'];

    it('rejects missing key specs', () => {
      assert.throws(() => splitMultiShardCommand(args, undefined), /Cannot split DEL: command has no key specification/);
      assert.throws(() => splitMultiShardCommand(args, []), /no key specification/);
    });

    it('rejects multiple key specs', () => {
      assert.throws(
        () => splitMultiShardCommand(args, [...RANGE_STEP_1, ...RANGE_STEP_1]),
        /multiple key specifications/
      );
    });

    it('rejects keyword begin_search', () => {
      assert.throws(
        () => splitMultiShardCommand(args, [{
          beginSearch: { type: 'keyword', keyword: 'STORE', startFrom: 1 },
          findKeys: { type: 'range', lastKey: -1, keyStep: 1, limit: 0 }
        }]),
        /unsupported begin_search type 'keyword'/
      );
    });

    it('rejects unknown spec parts', () => {
      assert.throws(
        () => splitMultiShardCommand(args, [{ beginSearch: { type: 'unknown' }, findKeys: { type: 'unknown' } }]),
        /unsupported begin_search type 'unknown'/
      );
      assert.throws(
        () => splitMultiShardCommand(args, [{ beginSearch: { type: 'index', index: 1 }, findKeys: { type: 'unknown' } }]),
        /unsupported find_keys type 'unknown'/
      );
    });

    it('rejects bounded ranges', () => {
      assert.throws(
        () => splitMultiShardCommand(['GET', '{a}1'], [{
          beginSearch: { type: 'index', index: 1 },
          findKeys: { type: 'range', lastKey: 0, keyStep: 1, limit: 0 }
        }]),
        /unsupported find_keys range/
      );
    });

    it('rejects malformed numkeys', () => {
      for (const numkeys of ['abc', '-1', '0', '2.5', '']) {
        assert.throws(
          () => splitMultiShardCommand(['MSETEX', numkeys, '{a}1', 'v1'], KEYNUM_STEP_2),
          /malformed numkeys/
        );
      }
    });

    it('rejects a key region overrunning the args (numkeys too large)', () => {
      assert.throws(
        () => splitMultiShardCommand(['MSETEX', '3', '{a}1', 'v1'], KEYNUM_STEP_2),
        /key region overruns/
      );
    });

    it('rejects a key region misaligned with keystep (MSET missing value)', () => {
      assert.throws(
        () => splitMultiShardCommand(['MSET', '{a}1', 'v1', '{b}1'], RANGE_STEP_2),
        /does not align with keystep/
      );
    });

    it('rejects an empty key region', () => {
      assert.throws(
        () => splitMultiShardCommand(['DEL'], RANGE_STEP_1),
        /key region/
      );
    });
  });
});
