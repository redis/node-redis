import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_CHANNELS from './PUBSUB_CHANNELS';
import { parseArgs } from './generic-transformers';

describe('PUBSUB CHANNELS', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(PUBSUB_CHANNELS),
        ['PUBSUB', 'CHANNELS']
      );
    });

    it('with pattern', () => {
      assert.deepEqual(
        parseArgs(PUBSUB_CHANNELS, 'patter*'),
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
