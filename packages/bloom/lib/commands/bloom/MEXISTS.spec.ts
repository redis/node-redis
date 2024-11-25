import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MEXISTS from './MEXISTS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.MEXISTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MEXISTS, 'key', ['1', '2']),
      ['BF.MEXISTS', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.bf.mExists', async client => {
    assert.deepEqual(
      await client.bf.mExists('key', ['1', '2']),
      [false, false]
    );
  }, GLOBAL.SERVERS.OPEN);
});
