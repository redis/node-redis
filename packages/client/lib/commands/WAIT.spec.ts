import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import WAIT from './WAIT';
import { parseArgs } from './generic-transformers';

describe('WAIT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(WAIT, 0, 1),
      ['WAIT', '0', '1']
    );
  });

  testUtils.testWithClient('client.wait', async client => {
    assert.equal(
      await client.wait(0, 1),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
