import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_COUNT from './COMMAND_COUNT';
import { parseArgs } from './generic-transformers';

describe('COMMAND COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(COMMAND_COUNT),
      ['COMMAND', 'COUNT']
    );
  });

  testUtils.testWithClient('client.commandCount', async client => {
    assert.equal(
      typeof await client.commandCount(),
      'number'
    );
  }, GLOBAL.SERVERS.OPEN);
});
