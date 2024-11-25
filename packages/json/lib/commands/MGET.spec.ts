import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET from './MGET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.MGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MGET, ['1', '2'], '$'),
      ['JSON.MGET', '1', '2', '$']
    );
  });

  testUtils.testWithClient('client.json.mGet', async client => {
    assert.deepEqual(
      await client.json.mGet(['1', '2'], '$'),
      [null, null]
    );
  }, GLOBAL.SERVERS.OPEN);
});
