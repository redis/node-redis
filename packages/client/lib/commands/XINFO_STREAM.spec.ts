import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XINFO_STREAM from './XINFO_STREAM';
import { parseArgs } from './generic-transformers';

describe('XINFO STREAM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XINFO_STREAM, 'key'),
      ['XINFO', 'STREAM', 'key']
    );
  });

  testUtils.testAll('xInfoStream', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xInfoStream('key')
    ]);

    assert.deepEqual(reply, {
      length: 0,
      'radix-tree-keys': 0,
      'radix-tree-nodes': 1,
      'last-generated-id': '0-0',
      ...testUtils.isVersionGreaterThan([7, 0]) && {
        'max-deleted-entry-id': '0-0',
        'entries-added': 0,
        'recorded-first-entry-id': '0-0',
      },
      groups: 1,
      'first-entry': null,
      'last-entry': null
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
