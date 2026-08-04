import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BGREWRITEAOF from './BGREWRITEAOF';
import { parseArgs } from './generic-transformers';

describe('BGREWRITEAOF', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BGREWRITEAOF),
      ['BGREWRITEAOF']
    );
  });

  testUtils.testWithClient('client.bgRewriteAof', async client => {
    const reply = await client.bgRewriteAof();
    // Structural assertion to pin RESP2 response shape
    assert.equal(typeof reply, 'string');
    assert.ok(reply.length > 0);
    // Verify response contains expected content patterns
    assert.ok(
      reply.includes('rewrite') ||
      reply.includes('Background') ||
      reply.includes('started') ||
      reply.includes('scheduled')
    );
  }, GLOBAL.SERVERS.OPEN);
});
