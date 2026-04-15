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

  testUtils.testWithClient('client.bf.mExists with existing items', async client => {
    const key = 'mExistsKey';
    await client.bf.add(key, 'item1');
    await client.bf.add(key, 'item2');

    assert.deepEqual(
      await client.bf.mExists(key, ['item1', 'item2', 'item3']),
      [true, true, false]
    );
  }, GLOBAL.SERVERS.OPEN);
});
