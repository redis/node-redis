import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MSET from './MSET';

describe('MSET', () => {
  describe('transformArguments', () => {
    it("['key1', 'value1', 'key2', 'value2']", () => {
      assert.deepEqual(
        MSET.transformArguments(['key1', 'value1', 'key2', 'value2']),
        ['MSET', 'key1', 'value1', 'key2', 'value2']
      );
    });

    it("[['key1', 'value1'], ['key2', 'value2']]", () => {
      assert.deepEqual(
        MSET.transformArguments([['key1', 'value1'], ['key2', 'value2']]),
        ['MSET', 'key1', 'value1', 'key2', 'value2']
      );
    });

    it("{key1: 'value1'. key2: 'value2'}", () => {
      assert.deepEqual(
        MSET.transformArguments({ key1: 'value1', key2: 'value2' }),
        ['MSET', 'key1', 'value1', 'key2', 'value2']
      );
    });
  });

  testUtils.testAll('mSet', async client => {
    assert.equal(
      await client.mSet(['{tag}key1', 'value1', '{tag}key2', 'value2']),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
