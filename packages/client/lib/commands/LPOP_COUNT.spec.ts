import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPOP_COUNT from './LPOP_COUNT';

describe('LPOP COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      LPOP_COUNT.transformArguments('key', 1),
      ['LPOP', 'key', '1']
    );
  });

  testUtils.testAll('lPopCount', async client => {
    assert.equal(
      await client.lPopCount('key', 1),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
