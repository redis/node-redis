import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_SHARDNUMSUB from './PUBSUB_SHARDNUMSUB';

describe('PUBSUB SHARDNUMSUB', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        PUBSUB_SHARDNUMSUB.transformArguments(),
        ['PUBSUB', 'SHARDNUMSUB']
      );
    });

    it('string', () => {
      assert.deepEqual(
        PUBSUB_SHARDNUMSUB.transformArguments('channel'),
        ['PUBSUB', 'SHARDNUMSUB', 'channel']
      );
    });

    it('array', () => {
      assert.deepEqual(
        PUBSUB_SHARDNUMSUB.transformArguments(['1', '2']),
        ['PUBSUB', 'SHARDNUMSUB', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.pubSubShardNumSub', async client => {
    assert.deepEqual(
      await client.pubSubShardNumSub(['foo', 'bar']),
      Object.create(null, {
        foo: {
          value: 0,
          configurable: true,
          enumerable: true
        },
        bar: {
          value: 0,
          configurable: true,
          enumerable: true
        }
      })
    );
  }, GLOBAL.SERVERS.OPEN);
});
