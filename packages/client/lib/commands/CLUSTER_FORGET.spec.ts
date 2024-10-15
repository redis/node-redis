import { strict as assert } from 'node:assert';
import CLUSTER_FORGET from './CLUSTER_FORGET';

describe('CLUSTER FORGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_FORGET.transformArguments('0'),
      ['CLUSTER', 'FORGET', '0']
    );
  });
});
