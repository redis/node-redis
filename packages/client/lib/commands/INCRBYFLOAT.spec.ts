import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCRBYFLOAT from './INCRBYFLOAT';
import { parseArgs } from './generic-transformers';

describe('INCRBYFLOAT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INCRBYFLOAT, 'key', 1.5),
      ['INCRBYFLOAT', 'key', '1.5']
    );
  });

  testUtils.testAll('incrByFloat', async client => {
    assert.equal(
      await client.incrByFloat('key', 1.5),
      '1.5'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
