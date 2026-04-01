import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_TRACKINGINFO from './CLIENT_TRACKINGINFO';
import { parseArgs } from './generic-transformers';

describe('CLIENT TRACKINGINFO', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_TRACKINGINFO),
      ['CLIENT', 'TRACKINGINFO']
    );
  });

  testUtils.testWithClient('client.clientTrackingInfo', async client => {
    assert.deepEqual(
      await client.clientTrackingInfo(),
      {
        flags: ['off'],
        redirect: -1,
        prefixes: []
      }
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.clientTrackingInfo with data', async client => {
    const reply = await client.clientTrackingInfo();
    assert.equal(reply.redirect, -1);
    assert.deepEqual(reply.prefixes, []);
    assert.ok(
      Array.isArray(reply.flags) || reply.flags instanceof Set,
      'flags should be an array or Set'
    );
    const flags = Array.isArray(reply.flags) ? reply.flags : [...reply.flags];
    assert.deepEqual(flags, ['off']);
  }, GLOBAL.SERVERS.OPEN);
});
