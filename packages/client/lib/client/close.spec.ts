import { strict as assert } from 'node:assert';
import net from 'node:net';
import { stub } from 'sinon';
import RedisClient from '.';
import { ClientClosedError, DisconnectsClientError } from '../errors';

describe('Client close before connection', () => {
    it('settles queued commands when closing before TCP connects', async () => {
      const transport = new net.Socket();
      const createConnection = stub(net, 'createConnection').returns(transport);
      const client = RedisClient.create({ RESP: 2, disableClientInfo: true, commandOptions: { timeout: undefined } });
      stub(transport, 'write').callsFake(() => {
        queueMicrotask(() => transport.emit('data', Buffer.from('+PONG\r\n')));
        return true;
      });

      try {
        const connecting = assert.rejects(client.connect(), ClientClosedError);
        const command = assert.rejects(client.ping(), DisconnectsClientError);
        const closing = client.close();
        transport.emit('connect');

        await Promise.all([connecting, command, closing]);
        assert.equal(client.isOpen, false);
        assert.equal(client.isReady, false);
        assert.equal(transport.destroyed, true);
      } finally {
        client.destroy();
        transport.destroy();
        createConnection.restore();
      }
    });

});
