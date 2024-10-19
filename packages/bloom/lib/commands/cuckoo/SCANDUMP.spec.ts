import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import SCANDUMP from './SCANDUMP';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.SCANDUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SCANDUMP, 'key', 0),
      ['CF.SCANDUMP', 'key', '0']
    );
  });

  testUtils.testWithClient('client.cf.scanDump', async client => {
    const [, reply] = await Promise.all([
      client.cf.reserve('key', 4),
      client.cf.scanDump('key', 0)
    ]);

    assert.deepEqual(reply, {
      iterator: 0,
      chunk: null
    });
  }, GLOBAL.SERVERS.OPEN);
});
