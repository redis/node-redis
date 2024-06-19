import { strict as assert } from 'node:assert';
import CLUSTER_FORGET from './CLUSTER_FORGET';
import { parseArgs } from './generic-transformers';

describe('CLUSTER FORGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_FORGET, '0'),
      ['CLUSTER', 'FORGET', '0']
    );
  });
});
