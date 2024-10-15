import { strict as assert } from 'node:assert';
import CLUSTER_FLUSHSLOTS from './CLUSTER_FLUSHSLOTS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER FLUSHSLOTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_FLUSHSLOTS),
      ['CLUSTER', 'FLUSHSLOTS']
    );
  });
});
