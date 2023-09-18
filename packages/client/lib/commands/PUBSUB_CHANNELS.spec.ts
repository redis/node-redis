import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_CHANNELS from './PUBSUB_CHANNELS';

describe('PUBSUB CHANNELS', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        PUBSUB_CHANNELS.transformArguments(),
        ['PUBSUB', 'CHANNELS']
      );
    });

    it('with pattern', () => {
      assert.deepEqual(
        PUBSUB_CHANNELS.transformArguments('patter*'),
        ['PUBSUB', 'CHANNELS', 'patter*']
      );
    });
  });

  testUtils.testWithClient('client.pubSubChannels', async client => {
    assert.deepEqual(
      await client.pubSubChannels(),
      []
    );
  }, GLOBAL.SERVERS.OPEN);
});
