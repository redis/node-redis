import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_INFO from './COMMAND_INFO';
import { parseArgs } from './generic-transformers';

describe('COMMAND INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(COMMAND_INFO, ['PING']),
      ['COMMAND', 'INFO', 'PING']
    );
  });

  testUtils.testWithClient('client.commandInfo', async client => {
    const reply = await client.commandInfo(['PING', 'NOT_A_REAL_COMMAND']),
      [ping, missing] = reply;

    assert.equal(reply.length, 2);

    assert.ok(ping);
    assert.equal(ping.name, 'ping');
    assert.equal(typeof ping.arity, 'number');
    assert.ok(ping.flags instanceof Set);
    assert.ok(ping.categories instanceof Set);
    assert.equal(typeof ping.firstKeyIndex, 'number');
    assert.equal(typeof ping.lastKeyIndex, 'number');
    assert.equal(typeof ping.step, 'number');

    assert.equal(missing, null);
  }, GLOBAL.SERVERS.OPEN);
});
