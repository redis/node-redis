import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BRPOPLPUSH from './BRPOPLPUSH';
import { parseArgs } from './generic-transformers';

describe('BRPOPLPUSH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BRPOPLPUSH, 'source', 'destination', 0),
      ['BRPOPLPUSH', 'source', 'destination', '0']
    );
  });

  testUtils.testAll('brPopLPush - null', async client => {
    assert.equal(
      await client.brPopLPush(
        '{tag}source',
        '{tag}destination',
        BLOCKING_MIN_VALUE
      ),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('brPopLPush - with member', async client => {
    const [, reply] = await Promise.all([
      client.lPush('{tag}source', 'element'),
      client.brPopLPush(
        '{tag}source',
        '{tag}destination',
        0
      )
    ]);

    assert.equal(reply, 'element');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
