import { strict as assert } from 'node:assert';
import type { CommandParser } from '../../client/parser';
import { reduceDefaultKeyed } from './dispatch';

// The reducer ignores the parser; a stub keeps the calls readable.
const PARSER = {} as CommandParser;

describe('reduceDefaultKeyed', () => {
  it('passes the sole reply through when not split (no hints)', async () => {
    const reply = await reduceDefaultKeyed([Promise.resolve(['v1', 'v2'])], PARSER);
    assert.deepEqual(reply, ['v1', 'v2']);
  });

  it('passes through when hints are all undefined (single-key command)', async () => {
    const reply = await reduceDefaultKeyed([Promise.resolve('v1')], PARSER, [undefined]);
    assert.equal(reply, 'v1');
  });

  it('passes through a single-slot multi_shard reply unchanged', async () => {
    const reply = await reduceDefaultKeyed(
      [Promise.resolve(['v0', 'v1', 'v2'])],
      PARSER,
      [[0, 1, 2]]
    );
    assert.deepEqual(reply, ['v0', 'v1', 'v2']);
  });

  it('scatters interleaved sub-replies back into original key order (MGET A,B,A,B)', async () => {
    // keys hash to A,B,A,B -> slot A holds groups [0,2], slot B holds [1,3].
    const reply = await reduceDefaultKeyed(
      [
        Promise.resolve(['a0', 'a2']),
        Promise.resolve(['b1', 'b3'])
      ],
      PARSER,
      [[0, 2], [1, 3]]
    );
    assert.deepEqual(reply, ['a0', 'b1', 'a2', 'b3']);
  });

  it('places each sub-reply by its hint regardless of plan order', async () => {
    // slot B (groups [1]) listed before slot A (groups [0,2]).
    const reply = await reduceDefaultKeyed(
      [
        Promise.resolve(['b1']),
        Promise.resolve(['a0', 'a2'])
      ],
      PARSER,
      [[1], [0, 2]]
    );
    assert.deepEqual(reply, ['a0', 'b1', 'a2']);
  });

  it('preserves null replies (missing keys) at their positions', async () => {
    const reply = await reduceDefaultKeyed(
      [
        Promise.resolve(['a0', null]),
        Promise.resolve([null])
      ],
      PARSER,
      [[0, 2], [1]]
    );
    assert.deepEqual(reply, ['a0', null, null]);
  });

  it('throws when a split reply is missing its position hint', async () => {
    await assert.rejects(
      reduceDefaultKeyed(
        [Promise.resolve(['a0']), Promise.resolve(['b1'])],
        PARSER,
        [[0], undefined]
      ),
      /missing position hints/
    );
  });
});
