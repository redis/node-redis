import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HSTRLEN from './HSTRLEN';

describe('HSTRLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HSTRLEN.transformArguments('key', 'field'),
      ['HSTRLEN', 'key', 'field']
    );
  });

  testUtils.testAll('hStrLen', async client => {
    assert.equal(
      await client.hStrLen('key', 'field'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
