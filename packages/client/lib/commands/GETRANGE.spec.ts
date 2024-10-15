import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETRANGE from './GETRANGE';

describe('GETRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      GETRANGE.transformArguments('key', 0, -1),
      ['GETRANGE', 'key', '0', '-1']
    );
  });

  testUtils.testAll('getRange', async client => {
    assert.equal(
      await client.getRange('key', 0, -1),
      ''
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
