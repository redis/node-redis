import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LATENCY_DOCTOR from './LATENCY_DOCTOR';
import { parseArgs } from './generic-transformers';

describe('LATENCY DOCTOR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LATENCY_DOCTOR),
      ['LATENCY', 'DOCTOR']
    );
  });

  testUtils.testWithClient('client.latencyDoctor', async client => {
    assert.equal(
      typeof await client.latencyDoctor(),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
