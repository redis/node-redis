import { strict as assert } from 'node:assert';
import REPLICAOF from './REPLICAOF';
import { parseArgs } from './generic-transformers';

describe('REPLICAOF', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(REPLICAOF, 'host', 1),
      ['REPLICAOF', 'host', '1']
    );
  });
});
