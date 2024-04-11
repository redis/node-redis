import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HGET from './HGET';

describe('HGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HGET.transformArguments('key', 'field'),
      ['HGET', 'key', 'field']
    );
  });

  testUtils.testAll('hGet', async client => {
    assert.equal(
      await client.hGet('key', 'field'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
