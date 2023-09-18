import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_SHARDCHANNELS from './PUBSUB_SHARDCHANNELS';

describe('PUBSUB SHARDCHANNELS', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('without pattern', () => {
      assert.deepEqual(
        PUBSUB_SHARDCHANNELS.transformArguments(),
        ['PUBSUB', 'SHARDCHANNELS']
      );
    });

    it('with pattern', () => {
      assert.deepEqual(
        PUBSUB_SHARDCHANNELS.transformArguments('patter*'),
        ['PUBSUB', 'SHARDCHANNELS', 'patter*']
      );
    });
  });

  testUtils.testWithClient('client.pubSubShardChannels', async client => {
    assert.deepEqual(
      await client.pubSubShardChannels(),
      []
    );
  }, GLOBAL.SERVERS.OPEN);
});
