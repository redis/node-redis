import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MEXISTS from './MEXISTS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.MEXISTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MEXISTS, 'key', ['1', '2']),
      ['CF.MEXISTS', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.cf.mExists', async client => {
    assert.deepEqual(
      await client.cf.mExists('key', ['1', '2']),
      [false, false]
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.cf.mExists with existing items', async client => {
    const key = 'mExistsKey';
    await client.cf.add(key, 'item1');
    await client.cf.add(key, 'item2');

    assert.deepEqual(
      await client.cf.mExists(key, ['item1', 'item2', 'item3']),
      [true, true, false]
    );
  }, GLOBAL.SERVERS.OPEN);
});
