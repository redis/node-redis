import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import GET from './GET';

describe('GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(GET, 'key'),
      ['GET', 'key']
    );
  });

  testUtils.testAll('get', async client => {
    assert.equal(
      await client.get('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testAll('get with value', async client => {
  //   await client.set('key', 'value');
  //   assert.deepEqual(
  //     await client.get('key'),
  //     'value'
  //   );
  // }, {
  //   client: GLOBAL.SERVERS.OPEN,
  //   cluster: GLOBAL.CLUSTERS.OPEN
  // });
});
