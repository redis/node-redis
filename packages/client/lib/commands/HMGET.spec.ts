import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HMGET from './HMGET';

describe('HMGET', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        HMGET.transformArguments('key', 'field'),
        ['HMGET', 'key', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        HMGET.transformArguments('key', ['field1', 'field2']),
        ['HMGET', 'key', 'field1', 'field2']
      );
    });
  });

  testUtils.testAll('hmGet', async client => {
    assert.deepEqual(
      await client.hmGet('key', 'field'),
      [null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
