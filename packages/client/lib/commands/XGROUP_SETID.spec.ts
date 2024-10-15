import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XGROUP_SETID from './XGROUP_SETID';
import { parseArgs } from './generic-transformers';

describe('XGROUP SETID', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XGROUP_SETID, 'key', 'group', '0'),
      ['XGROUP', 'SETID', 'key', 'group', '0']
    );
  });

  testUtils.testAll('xGroupSetId', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xGroupSetId('key', 'group', '0')
    ]);

    assert.equal(reply, 'OK');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
