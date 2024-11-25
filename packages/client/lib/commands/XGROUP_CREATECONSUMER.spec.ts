import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XGROUP_CREATECONSUMER from './XGROUP_CREATECONSUMER';
import { parseArgs } from './generic-transformers';

describe('XGROUP CREATECONSUMER', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XGROUP_CREATECONSUMER, 'key', 'group', 'consumer'),
      ['XGROUP', 'CREATECONSUMER', 'key', 'group', 'consumer']
    );
  });

  testUtils.testAll('xGroupCreateConsumer', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xGroupCreateConsumer('key', 'group', 'consumer')
    ]);

    assert.equal(reply, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
