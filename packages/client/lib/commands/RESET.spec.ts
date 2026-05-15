import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RESET from './RESET';
import { parseArgs } from './generic-transformers';

describe('RESET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RESET),
      ['RESET']
    );
  });

  testUtils.testWithClient('client.reset', async client => {
    assert.equal(
      await client.reset(),
      'RESET'
    );
  }, GLOBAL.SERVERS.OPEN);
});
