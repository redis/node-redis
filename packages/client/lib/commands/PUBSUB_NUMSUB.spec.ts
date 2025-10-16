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
