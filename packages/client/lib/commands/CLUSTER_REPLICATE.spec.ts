import { strict as assert } from 'node:assert';
import CLUSTER_REPLICATE from './CLUSTER_REPLICATE';
import { parseArgs } from './generic-transformers';

describe('CLUSTER REPLICATE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_REPLICATE, '0'),
      ['CLUSTER', 'REPLICATE', '0']
    );
  });
});
