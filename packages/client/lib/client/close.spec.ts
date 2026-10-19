import { strict as assert } from 'node:assert';
import net from 'node:net';
import { stub } from 'sinon';
import RedisClient from '.';
import { ClientClosedError } from '../errors';

describe('Client close', () => {
  it('still drains queued commands after the connection is ready', async () => {
    const transport = new net.Socket();
    const createConnection = stub(net, 'createConnection').returns(transport);
    stub(transport, 'write').returns(true);
    const client = RedisClient.create({ RESP: 2, disableClientInfo: true });

    try {
      const connecting = client.connect();
      transport.emit('connect');
      await connecting;
      const command = client.ping();
      let closed = false;
      const closing = client.close().then(() => { closed = true; });
      await new Promise<void>(resolve => setImmediate(resolve));
      assert.equal(closed, false);

      transport.emit('data', Buffer.from('+PONG\r\n'));
      assert.equal(await command, 'PONG');
      await closing;
      assert.equal(client.isOpen, false);
      assert.equal(client.isReady, false);
      assert.equal(transport.destroyed, true);
    } finally {
      client.destroy();
      transport.destroy();
      createConnection.restore();
    }
  });

  it('drains queued commands when closing before TCP connects', async () => {
    const transport = new net.Socket();
    const createConnection = stub(net, 'createConnection').returns(transport);
    const client = RedisClient.create({ RESP: 2, disableClientInfo: true, commandOptions: { timeout: undefined } });
    stub(transport, 'write').callsFake(() => {
      queueMicrotask(() => transport.emit('data', Buffer.from('+PONG\r\n')));
      return true;
    });

    try {
      const connecting = client.connect();
      const command = client.ping();
      const closing = client.close();
      transport.emit('connect');

      await connecting;
      assert.equal(await command, 'PONG');
      await closing;
      assert.equal(client.isOpen, false);
      assert.equal(client.isReady, false);
      assert.equal(transport.destroyed, true);
    } finally {
      client.destroy();
      transport.destroy();
      createConnection.restore();
    }
  });

  it('drains queued commands when closing during a reconnect', async () => {
    const transport = new net.Socket();
    const replacement = new net.Socket();
    const createConnection = stub(net, 'createConnection').returns(replacement);
    createConnection.onFirstCall().returns(transport);
    stub(replacement, 'write').callsFake(() => {
      queueMicrotask(() => replacement.emit('data', Buffer.from('+PONG\r\n')));
      return true;
    });
    const client = RedisClient.create({
      RESP: 2,
      disableClientInfo: true,
      socket: { reconnectStrategy: 0 },
      commandOptions: { timeout: undefined }
    }).on('error', () => {});

    try {
      const connecting = client.connect();
      transport.emit('connect');
      await connecting;

      transport.emit('error', new Error('Connection lost'));
      assert.equal(client.isReady, false);
      const command = client.ping();
      const closing = client.close();
      replacement.emit('connect');

      assert.equal(await command, 'PONG');
      await closing;
      assert.equal(client.isOpen, false);
      assert.equal(client.isReady, false);
      assert.equal(replacement.destroyed, true);
    } finally {
      client.destroy();
      transport.destroy();
      replacement.destroy();
      createConnection.restore();
    }
  });

  it('does not connect after closing with an empty queue while TCP connection is pending', async () => {
    const transport = new net.Socket();
    const createConnection = stub(net, 'createConnection').returns(transport);
    const client = RedisClient.create({ RESP: 2, disableClientInfo: true });
    const events: string[] = [];
    for (const event of ['connect', 'ready']) {
      client.on(event, () => events.push(event));
    }

    try {
      const connecting = assert.rejects(client.connect(), ClientClosedError);
      await client.close();
      transport.emit('connect');

      await connecting;
      assert.equal(client.isOpen, false);
      assert.equal(client.isReady, false);
      assert.equal(transport.destroyed, true);
      assert.deepEqual(events, []);
    } finally {
      client.destroy();
      transport.destroy();
      createConnection.restore();
    }
  });

});
