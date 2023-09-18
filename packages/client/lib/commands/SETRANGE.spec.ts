import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SETRANGE from './SETRANGE';

describe('SETRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SETRANGE.transformArguments('key', 0, 'value'),
      ['SETRANGE', 'key', '0', 'value']
    );
  });

  testUtils.testAll('setRange', async client => {
    assert.equal(
      await client.setRange('key', 0, 'value'),
      5
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
