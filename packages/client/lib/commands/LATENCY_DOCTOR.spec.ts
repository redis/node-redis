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

  testUtils.testWithClient('client.latencyDoctor returns plain bulk string (RESP2)', async client => {
    const reply = await client.latencyDoctor();

    // Must be a string (bulk string in RESP2, not verbatim string object)
    assert.equal(typeof reply, 'string');

    // Must be a plain primitive string, not an object
    assert.ok(reply.constructor === String || typeof reply === 'string');

    // Should not be a structured object (would indicate verbatim string transformation)
    assert.ok(!(reply && typeof reply === 'object' && 'format' in reply));
  }, GLOBAL.SERVERS.OPEN);
});
