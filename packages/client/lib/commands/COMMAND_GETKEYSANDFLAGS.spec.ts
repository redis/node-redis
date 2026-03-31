import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_GETKEYSANDFLAGS from './COMMAND_GETKEYSANDFLAGS';
import { parseArgs } from './generic-transformers';

describe('COMMAND GETKEYSANDFLAGS', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(COMMAND_GETKEYSANDFLAGS, ['GET', 'key']),
      ['COMMAND', 'GETKEYSANDFLAGS', 'GET', 'key']
    );
  });

  testUtils.testWithClient('client.commandGetKeysAndFlags', async client => {
    const reply = await client.commandGetKeysAndFlags(['GET', 'key']);

    assert.equal(reply.length, 1);
    assert.equal(reply[0].key, 'key');

    const flags = reply[0].flags;
    const normalized = [...flags].map(flag => flag.toLowerCase());

    assert.ok(normalized.includes('access'));
    assert.ok(normalized.includes('ro'));
  }, GLOBAL.SERVERS.OPEN);
});
