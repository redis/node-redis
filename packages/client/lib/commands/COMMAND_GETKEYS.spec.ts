import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_GETKEYS from './COMMAND_GETKEYS';

describe('COMMAND GETKEYS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      COMMAND_GETKEYS.transformArguments(['GET', 'key']),
      ['COMMAND', 'GETKEYS', 'GET', 'key']
    );
  });

  testUtils.testWithClient('client.commandGetKeys', async client => {
    assert.deepEqual(
      await client.commandGetKeys(['GET', 'key']),
      ['key']
    );
  }, GLOBAL.SERVERS.OPEN);
});
