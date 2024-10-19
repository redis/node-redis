import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import ADD from './ADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.ADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ADD, 'key', 'item'),
      ['CF.ADD', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.cf.add', async client => {
    assert.equal(
      await client.cf.add('key', 'item'),
      true
    );
  }, GLOBAL.SERVERS.OPEN);
});
