import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RENAMENX from './RENAMENX';

describe('RENAMENX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      RENAMENX.transformArguments('source', 'destination'),
      ['RENAMENX', 'source', 'destination']
    );
  });

  testUtils.testAll('renameNX', async client => {
    const [, reply] = await Promise.all([
      client.set('{tag}source', 'value'),
      client.renameNX('{tag}source', '{tag}destination')
    ]);

    assert.equal(reply, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
