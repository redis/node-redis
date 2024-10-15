import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import APPEND from './APPEND';

describe('APPEND', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      APPEND.transformArguments('key', 'value'),
      ['APPEND', 'key', 'value']
    );
  });

  testUtils.testAll('append', async client => {
    assert.equal(
      await client.append('key', 'value'),
      5
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
