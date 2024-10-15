import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SETNX from './SETNX';
import { parseArgs } from './generic-transformers';

describe('SETNX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SETNX, 'key', 'value'),
      ['SETNX', 'key', 'value']
    );
  });

  testUtils.testAll('setNX', async client => {
    assert.equal(
      await client.setNX('key', 'value'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
