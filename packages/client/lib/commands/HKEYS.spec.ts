import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HKEYS from './HKEYS';
import { parseArgs } from './generic-transformers';

describe('HKEYS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HKEYS, 'key'),
      ['HKEYS', 'key']
    );
  });

  testUtils.testAll('hKeys', async client => {
    assert.deepEqual(
      await client.hKeys('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('hKeys with data', async client => {
    await client.hSet('hash', {
      field1: 'value1',
      field2: 'value2',
      field3: 'value3'
    });

    const keys = await client.hKeys('hash');
    assert.deepEqual(
      keys.sort(),
      ['field1', 'field2', 'field3']
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
