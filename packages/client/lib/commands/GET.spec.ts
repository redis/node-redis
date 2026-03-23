import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import GET from './GET';

describe('GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(GET, 'key'),
      ['GET', 'key']
    );
  });

  // Regression: a plain Uint8Array (not Buffer) is what the RESP decoder
  // produces when typeMapping[BLOB_STRING] = Uint8Array.  Unlike Buffer,
  // Uint8Array#toString() returns comma-separated byte values ("52,50") rather
  // than the semantic string ("42"), so callers that pass the reply directly
  // to Number() receive NaN.  GET itself has no transformReply, making it the
  // lowest-level demonstration of the coercion hazard that also affects
  // commands with explicit numeric transforms (e.g. GEODIST, ZRANK WITHSCORE).
  describe('Uint8Array reply numeric-coercion hazard', () => {
    it('Number(Uint8Array) is NaN; Buffer.from(reply).toString() is required', () => {
      const rawReply = new Uint8Array(Buffer.from('42'));
      assert.ok(
        Number.isNaN(Number(rawReply)),
        `expected NaN but got ${Number(rawReply)}`
      );
      assert.equal(Buffer.from(rawReply).toString(), '42');
    });
  });

  testUtils.testAll('get', async client => {
    assert.equal(
      await client.get('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
