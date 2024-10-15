import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XGROUP_DELCONSUMER from './XGROUP_DELCONSUMER';
import { parseArgs } from './generic-transformers';

describe('XGROUP DELCONSUMER', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XGROUP_DELCONSUMER, 'key', 'group', 'consumer'),
      ['XGROUP', 'DELCONSUMER', 'key', 'group', 'consumer']
    );
  });

  testUtils.testAll('xGroupDelConsumer', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xGroupDelConsumer('key', 'group', 'consumer')
    ]);

    assert.equal(reply, 0);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
