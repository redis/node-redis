import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TYPE from './TYPE';
import { parseArgs } from './generic-transformers';

describe('TYPE', () => {
  it('processCommand', () => {
    assert.deepEqual(
      parseArgs(TYPE, 'key'),
      ['TYPE', 'key']
    );
  });

  testUtils.testAll('type', async client => {
    assert.equal(
      await client.type('key'),
      'none'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
