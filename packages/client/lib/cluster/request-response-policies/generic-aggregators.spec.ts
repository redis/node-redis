import { strict as assert } from 'node:assert';
import { aggregateLogicalAnd, aggregateLogicalOr, aggregateMerge } from './generic-aggregators';

describe('aggregateLogicalOr', () => {
  it('ORs element-wise across shards', () => {
    assert.deepEqual(aggregateLogicalOr([[1, 0, 0], [0, 0, 1]]), [1, 0, 1]);
  });

  it('returns all zeros when every shard reports zeros', () => {
    assert.deepEqual(aggregateLogicalOr([[0, 0], [0, 0]]), [0, 0]);
  });

  it('returns [] for an empty replies array', () => {
    assert.deepEqual(aggregateLogicalOr([]), []);
  });

  it('rejects non-numeric replies', () => {
    assert.throws(() => aggregateLogicalOr([['1', '0']]), /logical OR aggregation/);
  });
});

describe('aggregateMerge', () => {
  it('merges array replies with dedup', () => {
    assert.deepEqual(aggregateMerge([['a', 'b'], ['b', 'c']]), ['a', 'b', 'c']);
  });

  it('merges Map replies (last node wins per key)', () => {
    const merged = aggregateMerge<Map<string, number>>([
      new Map([['a', 1], ['b', 1]]),
      new Map([['b', 2]])
    ]);
    assert.deepEqual([...merged.entries()], [['a', 1], ['b', 2]]);
  });

  it('merges plain-object replies (RESP3 maps under the default type mapping)', () => {
    assert.deepEqual(
      aggregateMerge([{ a: 1, b: 1 }, { b: 2 }]),
      { a: 1, b: 2 }
    );
  });
});

describe('aggregateLogicalAnd', () => {
  it('ANDs element-wise across shards (SCRIPT EXISTS)', () => {
    assert.deepEqual(aggregateLogicalAnd([[1, 1, 0], [1, 0, 0]]), [1, 0, 0]);
  });

  it('rejects non-numeric replies', () => {
    assert.throws(() => aggregateLogicalAnd([['1']]), /logical AND aggregation/);
  });
});
