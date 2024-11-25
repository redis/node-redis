import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SWAPDB from './SWAPDB';
import { parseArgs } from './generic-transformers';

describe('SWAPDB', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SWAPDB, 0, 1),
      ['SWAPDB', '0', '1']
    );
  });

  testUtils.testWithClient('client.swapDb', async client => {
    assert.equal(
      await client.swapDb(0, 1),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
