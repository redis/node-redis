import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MSETNX from './MSETNX';
import { parseArgs } from './generic-transformers';

describe('MSETNX', () => {
  describe('transformArguments', () => {
    it("['key1', 'value1', 'key2', 'value2']", () => {
      assert.deepEqual(
        parseArgs(MSETNX, ['key1', 'value1', 'key2', 'value2']),
        ['MSETNX', 'key1', 'value1', 'key2', 'value2']
      );
    });

    it("[['key1', 'value1'], ['key2', 'value2']]", () => {
      assert.deepEqual(
        parseArgs(MSETNX, [['key1', 'value1'], ['key2', 'value2']]),
        ['MSETNX', 'key1', 'value1', 'key2', 'value2']
      );
    });

    it("{key1: 'value1'. key2: 'value2'}", () => {
      assert.deepEqual(
        parseArgs(MSETNX, { key1: 'value1', key2: 'value2' }),
        ['MSETNX', 'key1', 'value1', 'key2', 'value2']
      );
    });
  });

  testUtils.testAll('mSetNX', async client => {
    assert.equal(
      await client.mSetNX(['{key}1', 'value1', '{key}2', 'value2']),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
