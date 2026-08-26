import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import SCANDUMP from './SCANDUMP';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.SCANDUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SCANDUMP, 'key', 0),
      ['BF.SCANDUMP', 'key', '0']
    );
  });

  testUtils.testWithClient('client.bf.scanDump', async client => {
    const [, dump] = await Promise.all([
      client.bf.reserve('key', 0.01, 100),
      client.bf.scanDump('key', 0)
    ]);
    assert.equal(typeof dump, 'object');
    assert.equal(typeof dump.iterator, 'number');
    assert.equal(typeof dump.chunk, 'string');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.bf.scanDump iterating to the terminating pair', async client => {
    await client.bf.reserve('scandump-key', 0.01, 100);

    let iterator = 0;
    while (true) {
      const reply = await client.bf.scanDump('scandump-key', iterator);
      if (reply.iterator === 0) {
        assert.equal(reply.chunk, null);
        break;
      }

      assert.equal(typeof reply.chunk, 'string');
      iterator = reply.iterator;
    }
  }, GLOBAL.SERVERS.OPEN);
});
