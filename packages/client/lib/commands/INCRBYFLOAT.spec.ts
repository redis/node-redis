import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCRBYFLOAT from './INCRBYFLOAT';

describe('INCRBYFLOAT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      INCRBYFLOAT.transformArguments('key', 1.5),
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
