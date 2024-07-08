import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DBSIZE from './DBSIZE';
import { parseArgs } from './generic-transformers';

describe('DBSIZE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DBSIZE),
      ['DBSIZE']
    );
  });

  testUtils.testWithClient('client.dbSize', async client => {
    assert.equal(
      await client.dbSize(),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
