import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PSETEX from './PSETEX';
import { parseArgs } from './generic-transformers';

describe('PSETEX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(PSETEX, 'key', 1, 'value'),
      ['PSETEX', 'key', '1', 'value']
    );
  });

  testUtils.testAll('pSetEx', async client => {
    assert.equal(
      await client.pSetEx('key', 1, 'value'),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
