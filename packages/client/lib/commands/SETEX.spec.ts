import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SETEX from './SETEX';
import { parseArgs } from './generic-transformers';

describe('SETEX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SETEX, 'key', 1, 'value'),
      ['SETEX', 'key', '1', 'value']
    );
  });

  testUtils.testAll('setEx', async client => {
    assert.equal(
      await client.setEx('key', 1, 'value'),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
