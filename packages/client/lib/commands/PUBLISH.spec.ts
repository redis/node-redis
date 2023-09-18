import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBLISH from './PUBLISH';

describe('PUBLISH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      PUBLISH.transformArguments('channel', 'message'),
      ['PUBLISH', 'channel', 'message']
    );
  });

  testUtils.testWithClient('client.publish', async client => {
    assert.equal(
      await client.publish('channel', 'message'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
