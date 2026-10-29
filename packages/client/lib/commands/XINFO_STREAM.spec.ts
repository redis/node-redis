import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XINFO_STREAM from './XINFO_STREAM';
import { parseArgs } from './generic-transformers';
import { RESP_TYPES } from '../RESP/decoder';

describe('XINFO STREAM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XINFO_STREAM, 'key'),
      ['XINFO', 'STREAM', 'key']
    );
  });

  it('honours typeMapping for entry messages', () => {
    const reply = XINFO_STREAM.transformReply[2](
      ['length', 1, 'first-entry', ['1-1', ['field', 'value']], 'last-entry', null],
      undefined,
      { [RESP_TYPES.MAP]: Map }
    ) as unknown as Record<string, { message: unknown } | null>;

    const firstEntry = reply['first-entry'];
    assert.ok(firstEntry !== null);
    assert.ok(firstEntry.message instanceof Map);
    assert.deepEqual(firstEntry.message, new Map([['field', 'value']]));
    assert.equal(reply['last-entry'], null);
  });

  // With a BLOB_STRING -> Buffer mapping the reply keys are Buffers, so they have to be compared as strings
  it('parses entries of a RESP3 array reply with Buffer keys', () => {
    const reply = XINFO_STREAM.transformReply[3](
      [
        Buffer.from('first-entry'), [Buffer.from('1-1'), [Buffer.from('field'), Buffer.from('value')]],
        Buffer.from('last-entry'), null
      ],
      undefined,
      { [RESP_TYPES.MAP]: Array, [RESP_TYPES.BLOB_STRING]: Buffer }
    ) as unknown as Array<unknown>;

    assert.deepEqual(reply[1], {
      id: Buffer.from('1-1'),
      message: [Buffer.from('field'), Buffer.from('value')]
    });
  });

  testUtils.testWithClient('xInfoStream with RESP2 and a Buffer type mapping', async client => {
    await client.xAdd('key', '1-1', { field: 'value' });

    const reply = await client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer }).xInfoStream('key');
    const entry = { id: Buffer.from('1-1'), message: { field: Buffer.from('value') } };
    assert.deepEqual(reply['first-entry'], entry);
    assert.deepEqual(reply['last-entry'], entry);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 2
    }
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

    const expected = Object.assign({}, {
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
