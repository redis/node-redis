import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HVALS from './HVALS';
import { parseArgs } from './generic-transformers';

describe('HVALS', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(HVALS, 'key'),
      ['HVALS', 'key']
    );
  });

  testUtils.testAll('hVals', async client => {
    assert.deepEqual(
      await client.hVals('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('hVals with data', async client => {
    await client.hSet('key', {
      field1: 'value1',
      field2: 'value2',
      field3: 'value3'
    });

    const values = await client.hVals('key');
    assert.ok(Array.isArray(values));
    assert.equal(values.length, 3);
    assert.deepEqual(
      values.sort(),
      ['value1', 'value2', 'value3']
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
