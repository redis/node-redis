import { strict as assert } from 'node:assert';
import { aggregateLogicalAnd, aggregateLogicalOr, aggregateMerge, aggregateMin, aggregateMax } from './generic-aggregators';

describe('aggregateLogicalOr', () => {
  it('ORs element-wise across shards', () => {
    assert.deepEqual(aggregateLogicalOr([[1, 0, 0], [0, 0, 1]]), [1, 0, 1]);
  });

  it('returns all zeros when every shard reports zeros', () => {
    assert.deepEqual(aggregateLogicalOr([[0, 0], [0, 0]]), [0, 0]);
  });

  it('clamps non-binary numbers to 0/1', () => {
    assert.deepEqual(aggregateLogicalOr([[0, 0], [2, 0]]), [1, 0]);
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

  it('clamps non-binary numbers to 0/1', () => {
    assert.deepEqual(aggregateLogicalAnd([[1, 2], [1, 3]]), [1, 1]);
  });

  it('rejects non-numeric replies', () => {
    assert.throws(() => aggregateLogicalAnd([['1']]), /logical AND aggregation/);
  });
});

describe('aggregateMin', () => {
  it('takes the minimum of scalar replies (WAIT)', () => {
    assert.equal(aggregateMin([2, 0, 1]), 0);
  });

  it('takes the element-wise minimum of array replies (WAITAOF)', () => {
    // each shard: [numlocal, numreplicas]
    assert.deepEqual(aggregateMin([[1, 3], [1, 0], [0, 2]]), [0, 0]);
  });

  it('returns 0 for an empty replies array', () => {
    assert.equal(aggregateMin([]), 0);
  });

  it('rejects non-numeric scalar replies', () => {
    assert.throws(() => aggregateMin(['1', '2']), /numbers for min aggregation/);
  });

  it('rejects array replies of unequal length', () => {
    assert.throws(() => aggregateMin([[1, 2], [1]]), /number arrays of equal length for min/);
  });
});

describe('aggregateMax', () => {
  it('takes the maximum of scalar replies', () => {
    assert.equal(aggregateMax([2, 0, 5]), 5);
  });

  it('takes the element-wise maximum of array replies', () => {
    assert.deepEqual(aggregateMax([[1, 3], [1, 0], [0, 2]]), [1, 3]);
  });

  it('rejects array replies with a non-numeric element', () => {
    assert.throws(() => aggregateMax([[1, '2']]), /number arrays of equal length for max/);
  });
});
