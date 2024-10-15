import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PUBSUB_NUMPAT from './PUBSUB_NUMPAT';

describe('PUBSUB NUMPAT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      PUBSUB_NUMPAT.transformArguments(),
      ['PUBSUB', 'NUMPAT']
    );
  });

  testUtils.testWithClient('client.pubSubNumPat', async client => {
    assert.equal(
      await client.pubSubNumPat(),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
