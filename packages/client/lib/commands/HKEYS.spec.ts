import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HKEYS from './HKEYS';
import { parseArgs } from './generic-transformers';

describe('HKEYS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HKEYS, 'key'),
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
