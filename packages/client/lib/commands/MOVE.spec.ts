import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MOVE from './MOVE';
import { parseArgs } from './generic-transformers';

describe('MOVE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MOVE, 'key', 1),
      ['MOVE', 'key', '1']
    );
  });

  testUtils.testWithClient('client.move', async client => {
    assert.equal(
      await client.move('key', 1),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
