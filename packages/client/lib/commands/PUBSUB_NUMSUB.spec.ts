import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_NUMSUB from './PUBSUB_NUMSUB';
import { parseArgs } from './generic-transformers';

describe('PUBSUB NUMSUB', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(PUBSUB_NUMSUB),
        ['PUBSUB', 'NUMSUB']
      );
    });

    it('string', () => {
      assert.deepEqual(
        parseArgs(PUBSUB_NUMSUB, 'channel'),
        ['PUBSUB', 'NUMSUB', 'channel']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(PUBSUB_NUMSUB, ['1', '2']),
        ['PUBSUB', 'NUMSUB', '1', '2']
      );
    });
  });

  // Regression: Uint8Array channel names must be decoded as UTF-8 strings, not
  // as comma-separated byte lists produced by Uint8Array#toString().
  describe('transformReply Uint8Array key preservation', () => {
    it('Uint8Array channel name is decoded as UTF-8 string', () => {
      // A plain Uint8Array (not Buffer) is what the RESP decoder produces when
      // typeMapping[BLOB_STRING] = Uint8Array.  Its .toString() returns a
      // byte-list like "109,121,99,104,97,110" instead of the semantic "mychan".
      const channel = new Uint8Array(Buffer.from('mychan'));
      const rawReply = [channel, 42] as any;

      const result = PUBSUB_NUMSUB.transformReply(rawReply) as unknown as Record<string, number>;

      assert.ok(
        Object.prototype.hasOwnProperty.call(result, 'mychan'),
        `expected key 'mychan' but got keys: ${JSON.stringify(Object.keys(result))}`
      );
      assert.equal(result['mychan'], 42);
    });
  });

  testUtils.testWithClient('client.pubSubNumSub resp2', async client => {
    assert.deepEqual(
      await client.pubSubNumSub(),
      Object.create(null)
    );

    const res = await client.PUBSUB_NUMSUB(["test", "test2"]);
    assert.equal(res.test, 0);
    assert.equal(res.test2, 0);

  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 2
    }
  });

  testUtils.testWithClient('client.pubSubNumSub resp3', async client => {
    assert.deepEqual(
      await client.pubSubNumSub(),
      Object.create(null)
    );

    const res = await client.PUBSUB_NUMSUB(["test", "test2"]);
    assert.equal(res.test, 0);
    assert.equal(res.test2, 0);

  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });

});
