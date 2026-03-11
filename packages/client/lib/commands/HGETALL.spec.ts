import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HGETALL from './HGETALL';
import { RESP_TYPES } from '../RESP/decoder';

describe('HGETALL', () => {

  // Regression: Uint8Array field keys must be decoded as UTF-8 strings, not as
  // comma-separated byte lists ("102,111,111") produced by Uint8Array#toString().
  describe('transformReply Uint8Array key preservation', () => {
    it('object map (default typeMapping): Uint8Array field key is decoded as UTF-8 string', () => {
      // A plain Uint8Array (not Buffer) is what the RESP decoder produces when
      // typeMapping[BLOB_STRING] = Uint8Array.  Its .toString() returns the
      // byte-list form "102,111,111", not the semantic string "foo".
      const fieldKey = new Uint8Array(Buffer.from('foo'));
      const rawReply = [fieldKey, 'bar'] as any;

      const result = HGETALL.transformReply[2](rawReply) as unknown as Record<string, string>;

      assert.ok(
        Object.prototype.hasOwnProperty.call(result, 'foo'),
        `expected key 'foo' but got keys: ${JSON.stringify(Object.keys(result))}`
      );
      assert.equal(result['foo'], 'bar');
    });

    it('Map typeMapping: Uint8Array field key is decoded as UTF-8 string', () => {
      const fieldKey = new Uint8Array(Buffer.from('foo'));
      const rawReply = [fieldKey, 'bar'] as any;

      const result = HGETALL.transformReply[2](
        rawReply,
        undefined,
        { [RESP_TYPES.MAP]: Map }
      ) as unknown as Map<string, string>;

      assert.ok(
        result.has('foo'),
        `expected Map key 'foo' but Map has keys: [${[...result.keys()].join(', ')}]`
      );
      assert.equal(result.get('foo'), 'bar');
    });
  });

  testUtils.testAll('hGetAll empty', async client => {
    assert.deepEqual(
      await client.hGetAll('key'),
      Object.create(null)
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('hGetAll with value', async client => {
    const [, reply] = await Promise.all([
      client.hSet('key', 'field', 'value'),
      client.hGetAll('key')
    ]);
    assert.deepEqual(
      reply,
      Object.create(null, {
        field: {
          value: 'value',
          enumerable: true
        }
      })
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
