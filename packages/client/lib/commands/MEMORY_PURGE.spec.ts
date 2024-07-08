import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MEMORY_PURGE from './MEMORY_PURGE';
import { parseArgs } from './generic-transformers';

describe('MEMORY PURGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MEMORY_PURGE),
      ['MEMORY', 'PURGE']
    );
  });

  testUtils.testWithClient('client.memoryPurge', async client => {
    assert.equal(
      await client.memoryPurge(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
