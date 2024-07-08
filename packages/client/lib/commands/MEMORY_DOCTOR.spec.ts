import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MEMORY_DOCTOR from './MEMORY_DOCTOR';
import { parseArgs } from './generic-transformers';

describe('MEMORY DOCTOR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MEMORY_DOCTOR),
      ['MEMORY', 'DOCTOR']
    );
  });

  testUtils.testWithClient('client.memoryDoctor', async client => {
    assert.equal(
      typeof (await client.memoryDoctor()),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
