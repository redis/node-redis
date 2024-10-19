import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import ADDNX from './ADDNX';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CF.ADDNX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ADDNX, 'key', 'item'),
      ['CF.ADDNX', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.cf.add', async client => {
    assert.equal(
      await client.cf.addNX('key', 'item'),
      true
    );
  }, GLOBAL.SERVERS.OPEN);
});
