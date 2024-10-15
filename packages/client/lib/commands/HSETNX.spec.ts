import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HSETNX from './HSETNX';

describe('HSETNX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HSETNX.transformArguments('key', 'field', 'value'),
      ['HSETNX', 'key', 'field', 'value']
    );
  });

  testUtils.testAll('hSetNX', async client => {
    assert.equal(
      await client.hSetNX('key', 'field', 'value'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
