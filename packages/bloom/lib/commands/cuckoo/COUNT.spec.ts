import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import COUNT from './COUNT';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(COUNT, 'key', 'item'),
      ['CF.COUNT', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.cf.count', async client => {
    assert.equal(
      await client.cf.count('key', 'item'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
