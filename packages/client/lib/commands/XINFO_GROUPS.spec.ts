import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XINFO_GROUPS from './XINFO_GROUPS';
import { parseArgs } from './generic-transformers';

describe('XINFO GROUPS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XINFO_GROUPS, 'key'),
      ['XINFO', 'GROUPS', 'key']
    );
  });

  testUtils.testAll('xInfoGroups', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xInfoGroups('key')
    ]);
    
    assert.deepEqual(
      reply,
      [{
        name: 'group',
        consumers: 0,
        pending: 0,
        'last-delivered-id': '0-0',
        'entries-read': testUtils.isVersionGreaterThan([7, 0]) ? null : undefined,
        lag: testUtils.isVersionGreaterThan([7, 0]) ? 0 : undefined
      }]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
