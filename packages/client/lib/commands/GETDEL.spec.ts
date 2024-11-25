import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETDEL from './GETDEL';
import { parseArgs } from './generic-transformers';

describe('GETDEL', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(GETDEL, 'key'),
      ['GETDEL', 'key']
    );
  });

  testUtils.testAll('getDel', async client => {
    assert.equal(
      await client.getDel('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
