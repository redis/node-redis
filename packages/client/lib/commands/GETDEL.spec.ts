import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETDEL from './GETDEL';

describe('GETDEL', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      GETDEL.transformArguments('key'),
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
