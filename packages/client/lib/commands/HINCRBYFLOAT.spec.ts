import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HINCRBYFLOAT from './HINCRBYFLOAT';

describe('HINCRBYFLOAT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HINCRBYFLOAT.transformArguments('key', 'field', 1.5),
      ['HINCRBYFLOAT', 'key', 'field', '1.5']
    );
  });

  testUtils.testAll('hIncrByFloat', async client => {
    assert.equal(
      await client.hIncrByFloat('key', 'field', 1.5),
      '1.5'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
