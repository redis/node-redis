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
      ...testUtils.isVersionGreaterThan([8, 6]) && {
        'idmp-duration': 100,
        'idmp-maxsize': 100,
        'pids-tracked': 0,
        'iids-tracked': 0,
        'iids-added': 0,
        'iids-duplicates': 0,
      },
      groups: 1,
      'first-entry': null,
      'last-entry': null
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('xInfoStream with RESP3', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xInfoStream('key')
    ]);

    const expected = Object.assign(Object.create(null), {
      length: 0,
      'radix-tree-keys': 0,
      'radix-tree-nodes': 1,
      'last-generated-id': '0-0',
      ...testUtils.isVersionGreaterThan([7, 0]) && {
        'max-deleted-entry-id': '0-0',
        'entries-added': 0,
        'recorded-first-entry-id': '0-0',
      },
      ...testUtils.isVersionGreaterThan([8, 6]) && {
        'idmp-duration': 100,
        'idmp-maxsize': 100,
        'pids-tracked': 0,
        'iids-tracked': 0,
        'iids-added': 0,
        'iids-duplicates': 0,
      },
      groups: 1,
      'first-entry': null,
      'last-entry': null
    });
    assert.deepEqual(reply, expected);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    }
  });
});
