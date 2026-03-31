import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND from './COMMAND';
import { parseArgs } from './generic-transformers';

describe('COMMAND', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(COMMAND),
      ['COMMAND']
    );
  });

  testUtils.testWithClient('client.command', async client => {
    const commands = await client.command(),
      ping = commands.find(command => command.name === 'ping');

    assert.ok(ping);
    assert.equal(typeof ping.arity, 'number');
    assert.ok(ping.flags instanceof Set);
    assert.ok(ping.categories instanceof Set);
    assert.equal(typeof ping.firstKeyIndex, 'number');
    assert.equal(typeof ping.lastKeyIndex, 'number');
    assert.equal(typeof ping.step, 'number');
  }, GLOBAL.SERVERS.OPEN);
});
