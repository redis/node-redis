import { strict as assert } from 'node:assert';
import CLIENT_INFO from './CLIENT_INFO';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import { version } from '../../package.json';

describe('CLIENT INFO', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_INFO),
      ['CLIENT', 'INFO']
    );
  });

  testUtils.testWithClient('client.clientInfo', async client => {
    const reply = await client.clientInfo();
    assert.equal(typeof reply.id, 'number');
    assert.equal(typeof reply.addr, 'string');
    assert.equal(typeof reply.laddr, 'string');
    assert.equal(typeof reply.fd, 'number');
    assert.equal(typeof reply.name, 'string');
    assert.equal(typeof reply.age, 'number');
    assert.equal(typeof reply.idle, 'number');
    assert.equal(typeof reply.flags, 'string');
    assert.equal(typeof reply.db, 'number');
    assert.equal(typeof reply.sub, 'number');
    assert.equal(typeof reply.psub, 'number');
    assert.equal(typeof reply.multi, 'number');
    assert.equal(typeof reply.qbuf, 'number');
    assert.equal(typeof reply.qbufFree, 'number');
    assert.equal(typeof reply.argvMem, 'number');
    assert.equal(typeof reply.obl, 'number');
    assert.equal(typeof reply.oll, 'number');
    assert.equal(typeof reply.omem, 'number');
    assert.equal(typeof reply.totMem, 'number');
    assert.equal(typeof reply.events, 'string');
    assert.equal(typeof reply.cmd, 'string');
    assert.equal(typeof reply.user, 'string');
    assert.equal(typeof reply.redir, 'number');

    if (testUtils.isVersionGreaterThan([7, 0])) {
      assert.equal(typeof reply.multiMem, 'number');
      assert.equal(typeof reply.resp, 'number');

      if (testUtils.isVersionGreaterThan([7, 0, 3])) {
        assert.equal(typeof reply.ssub, 'number');
      }
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.clientInfo Redis < 7', async client => {
    const reply = await client.clientInfo();
    if (!testUtils.isVersionGreaterThan([7])) {
      assert.strictEqual(reply.libName, undefined, 'LibName should be undefined for Redis < 7');
      assert.strictEqual(reply.libVer, undefined, 'LibVer should be undefined for Redis < 7');
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 info disabled', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, '');
    assert.equal(reply.libVer, '');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      disableClientInfo: true
    }
  });

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 resp unset, info enabled, tag set', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, 'node-redis(client1)');
    assert.equal(reply.libVer, version);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      clientInfoTag: 'client1'
    }
  });

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 resp unset, info enabled, tag unset', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, 'node-redis');
    assert.equal(reply.libVer, version);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 resp2 info enabled', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, 'node-redis(client1)');
    assert.equal(reply.libVer, version);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 2,
      clientInfoTag: 'client1'
    }
  });

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 resp2 info disabled', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, '');
    assert.equal(reply.libVer, '');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      disableClientInfo: true,
      RESP: 2
    }
  });

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 resp3 info enabled', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, 'node-redis(client1)');
    assert.equal(reply.libVer, version);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3,
      clientInfoTag: 'client1'
    }
  });

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.clientInfo Redis>=7 resp3 info disabled', async client => {
    const reply = await client.clientInfo();
    assert.equal(reply.libName, '');
    assert.equal(reply.libVer, '');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      disableClientInfo: true,
      RESP: 3
    }
  });

});
