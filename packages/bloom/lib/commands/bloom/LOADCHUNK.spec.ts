import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import LOADCHUNK from './LOADCHUNK';
import { RESP_TYPES } from '@redis/client';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.LOADCHUNK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LOADCHUNK, 'key', 0, ''),
      ['BF.LOADCHUNK', 'key', '0', '']
    );
  });

  testUtils.testWithClient('client.bf.loadChunk', async client => {
    const [, { iterator, chunk }] = await Promise.all([
      client.bf.reserve('source', 0.01, 100),
      client.bf.scanDump('source', 0)
    ]);

    assert.equal(
      await client.bf.loadChunk('destination', iterator, chunk),
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
