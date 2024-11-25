import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETSET from './GETSET';
import { parseArgs } from './generic-transformers';

describe('GETSET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(GETSET, 'key', 'value'),
      ['GETSET', 'key', 'value']
    );
  });

  testUtils.testAll('getSet', async client => {
    assert.equal(
      await client.getSet('key', 'value'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
