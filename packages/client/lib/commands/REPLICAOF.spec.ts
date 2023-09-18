import { strict as assert } from 'node:assert';
import REPLICAOF from './REPLICAOF';

describe('REPLICAOF', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      REPLICAOF.transformArguments('host', 1),
      ['REPLICAOF', 'host', '1']
    );
  });
});
