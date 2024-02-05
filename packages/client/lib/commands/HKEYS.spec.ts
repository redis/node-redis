import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HKEYS from './HKEYS';

describe('HKEYS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HKEYS.transformArguments('key'),
      ['HKEYS', 'key']
    );
  });

  testUtils.testAll('hKeys', async client => {
    assert.deepEqual(
      await client.hKeys('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
