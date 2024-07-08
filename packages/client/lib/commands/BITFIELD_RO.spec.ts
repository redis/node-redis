import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITFIELD_RO from './BITFIELD_RO';
import { parseArgs } from './generic-transformers';

describe('BITFIELD_RO', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('parseCommand', () => {
    assert.deepEqual(
      parseArgs(BITFIELD_RO, 'key', [{
        encoding: 'i8',
        offset: 0
      }]),
      ['BITFIELD_RO', 'key', 'GET', 'i8', '0']
    );
  });

  testUtils.testAll('bitFieldRo', async client => {
    assert.deepEqual(
      await client.bitFieldRo('key', [{
        encoding: 'i8',
        offset: 0
      }]),
      [0]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
