import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import WAITAOF from './WAITAOF';
import { parseArgs } from './generic-transformers';

describe('WAITAOF', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(WAITAOF, 0, 0, 1),
      ['WAITAOF', '0', '0', '1']
    );
  });

  testUtils.testWithClient('client.waitAof', async client => {
    assert.deepEqual(
      await client.waitAof(0, 0, 1),
      [0, 0]
    );
  }, GLOBAL.SERVERS.OPEN);
});
