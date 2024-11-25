import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import LOADCHUNK from './LOADCHUNK';
import { RESP_TYPES } from '@redis/client';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.LOADCHUNK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LOADCHUNK, 'item', 0, ''),
      ['CF.LOADCHUNK', 'item', '0', '']
    );
  });

  testUtils.testWithClient('client.cf.loadChunk', async client => {
    const [, , { iterator, chunk }] = await Promise.all([
      client.cf.reserve('source', 4),
      client.cf.add('source', 'item'),
      client.cf.scanDump('source', 0)
    ]);

    assert.equal(
      await client.cf.loadChunk('destination', iterator, chunk!),
      'OK'
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      commandOptions: {
        typeMapping: {
          [RESP_TYPES.BLOB_STRING]: Buffer
        }
      }
    }
  });
});
