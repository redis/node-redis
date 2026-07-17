import { strict as assert } from 'node:assert';
import { aggregateLogicalAnd, aggregateLogicalOr } from './generic-aggregators';

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

describe('aggregateLogicalAnd', () => {
  it('ANDs element-wise across shards (SCRIPT EXISTS)', () => {
    assert.deepEqual(aggregateLogicalAnd([[1, 1, 0], [1, 0, 0]]), [1, 0, 0]);
  });

  it('rejects non-numeric replies', () => {
    assert.throws(() => aggregateLogicalAnd([['1']]), /logical AND aggregation/);
  });
});
