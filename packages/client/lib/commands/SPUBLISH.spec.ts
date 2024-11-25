import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPUBLISH from './SPUBLISH';
import { parseArgs } from './generic-transformers';

describe('SPUBLISH', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SPUBLISH, 'channel', 'message'),
      ['SPUBLISH', 'channel', 'message']
    );
  });

  testUtils.testAll('sPublish', async client => {
    assert.equal(
      await client.sPublish('channel', 'message'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
