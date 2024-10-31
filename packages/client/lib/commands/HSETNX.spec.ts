import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HSETNX from './HSETNX';
import { parseArgs } from './generic-transformers';

describe('HSETNX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HSETNX, 'key', 'field', 'value'),
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
