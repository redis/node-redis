import { strict as assert } from 'assert';
import CLUSTER_FLUSHSLOTS from './CLUSTER_FLUSHSLOTS';

describe('CLUSTER FLUSHSLOTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_FLUSHSLOTS.transformArguments(),
      ['CLUSTER', 'FLUSHSLOTS']
    );
  });
});
