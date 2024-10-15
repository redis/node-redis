import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_COUNT from './COMMAND_COUNT';

describe('COMMAND COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      COMMAND_COUNT.transformArguments(),
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
