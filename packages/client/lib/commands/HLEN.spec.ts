import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HLEN from './HLEN';
import { parseArgs } from './generic-transformers';

describe('HLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HLEN, 'key'),
      ['HLEN', 'key']
    );
  });

  testUtils.testAll('hLen', async client => {
    assert.equal(
      await client.hLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('hLen with fields', async client => {
    await client.hSet('key', { field1: 'value1', field2: 'value2', field3: 'value3' });
    assert.strictEqual(
      await client.hLen('key'),
      3
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
