import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_NUMSUB from './PUBSUB_NUMSUB';

describe('PUBSUB NUMSUB', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        PUBSUB_NUMSUB.transformArguments(),
        ['PUBSUB', 'NUMSUB']
      );
    });

    it('string', () => {
      assert.deepEqual(
        PUBSUB_NUMSUB.transformArguments('channel'),
        ['PUBSUB', 'NUMSUB', 'channel']
      );
    });

    it('array', () => {
      assert.deepEqual(
        PUBSUB_NUMSUB.transformArguments(['1', '2']),
        ['PUBSUB', 'NUMSUB', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.pubSubNumSub', async client => {
    assert.deepEqual(
      await client.pubSubNumSub(),
      Object.create(null)
    );
  }, GLOBAL.SERVERS.OPEN);
});
