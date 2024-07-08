import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RENAME from './RENAME';
import { parseArgs } from './generic-transformers';

describe('RENAME', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RENAME, 'source', 'destination'),
      ['RENAME', 'source', 'destination']
    );
  });

  testUtils.testAll('rename', async client => {
    const [, reply] = await Promise.all([
      client.set('{tag}source', 'value'),
      client.rename('{tag}source', '{tag}destination')
    ]);
    
    assert.equal(reply, 'OK');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
