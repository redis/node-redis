import { strict as assert } from 'node:assert';
import CLUSTER_REPLICATE from './CLUSTER_REPLICATE';

describe('CLUSTER REPLICATE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_REPLICATE.transformArguments('0'),
      ['CLUSTER', 'REPLICATE', '0']
    );
  });
});
