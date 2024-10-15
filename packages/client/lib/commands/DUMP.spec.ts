import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DUMP from './DUMP';
import { parseArgs } from './generic-transformers';

describe('DUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DUMP, 'key'),
      ['DUMP', 'key']
    );
  });

  testUtils.testAll('client.dump', async client => {
    assert.equal(
      await client.dump('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
