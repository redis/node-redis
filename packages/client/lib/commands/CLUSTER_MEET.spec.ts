import { strict as assert } from 'node:assert';
import CLUSTER_MEET from './CLUSTER_MEET';
import { parseArgs } from './generic-transformers';

describe('CLUSTER MEET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_MEET, '127.0.0.1', 6379),
      ['CLUSTER', 'MEET', '127.0.0.1', '6379']
    );
  });
});
