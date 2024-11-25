import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LASTSAVE from './LASTSAVE';
import { parseArgs } from './generic-transformers';

describe('LASTSAVE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LASTSAVE),
      ['LASTSAVE']
    );
  });

  testUtils.testWithClient('client.lastSave', async client => {
    assert.equal(
      typeof await client.lastSave(),
      'number'
    );
  }, GLOBAL.SERVERS.OPEN);
});
