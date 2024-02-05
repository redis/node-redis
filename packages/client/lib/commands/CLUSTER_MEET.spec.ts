import { strict as assert } from 'node:assert';
import CLUSTER_MEET from './CLUSTER_MEET';

describe('CLUSTER MEET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_MEET.transformArguments('127.0.0.1', 6379),
      ['CLUSTER', 'MEET', '127.0.0.1', '6379']
    );
  });
});
