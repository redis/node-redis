import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HRANDFIELD_COUNT_WITHVALUES from './HRANDFIELD_COUNT_WITHVALUES';
import { parseArgs } from './generic-transformers';

describe('HRANDFIELD COUNT WITHVALUES', () => {
  testUtils.isVersionGreaterThanHook([6, 2, 5]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HRANDFIELD_COUNT_WITHVALUES, 'key', 1),
      ['HRANDFIELD', 'key', '1', 'WITHVALUES']
    );
  });

  testUtils.testAll('hRandFieldCountWithValues', async client => {
    await client.hSet('key', 'field', 'value');

    assert.deepEqual(
      await client.hRandFieldCountWithValues('key', -2),
      [
        {
          field: 'field',
          value: 'value'
        },
        {
          field: 'field',
          value: 'value'
        }
      ]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testWithClient('hRandFieldCountWithValues with RESP3', async client => {
    await client.hSet('key', 'field', 'value');

    assert.deepEqual(
      await client.hRandFieldCountWithValues('key', -2),
      [
        {
          field: 'field',
          value: 'value'
        },
        {
          field: 'field',
          value: 'value'
        }
      ]
    );
  }, GLOBAL.SERVERS.OPEN_RESP_3);
});
