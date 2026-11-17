import { strict as assert } from 'node:assert';
import net from 'node:net';
import { PubSubProxy } from './pub-sub-proxy';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Closed ports on ::1 refuse immediately, the same stand-in #3624 uses for a
 * master that just went down. No Redis server and no Docker.
 */
function closedNode(port: number) {
  return { host: '::1', port };
}

/**
 * Records each reconnect attempt keyed by the port in the socket error
 * (`connect ECONNREFUSED ::1:7001`). `stillRetrying` matches the issue repro:
 * a port whose latest attempt is under a second old is still reconnecting.
 */
function trackReconnects(giveUpPort?: string) {
  const attempts = new Map<string, Array<number>>();
  let stop = false;

  const reconnectStrategy = (retries: number, cause: Error) => {
    const port = /:(\d+)$/.exec(cause?.message ?? '')?.[1];
    if (port !== undefined) {
      const times = attempts.get(port);
      if (times) {
        times.push(Date.now());
      } else {
        attempts.set(port, [Date.now()]);
      }
    }

    if (stop) return new Error('stop');
    if (giveUpPort !== undefined && port === giveUpPort && retries >= 3) {
      return new Error('give up');
    }
    return 200;
  };

  const stillRetrying = () => [...attempts]
    .filter(([, times]) => Date.now() - times[times.length - 1] < 1000)
    .map(([port]) => port)
    .sort();

  return {
    attempts,
    reconnectStrategy,
    stillRetrying,
    stopRetrying() {
      stop = true;
    }
  };
}

describe('PubSubProxy.changeNode while the subscriber is still connecting', function () {
  this.timeout(20_000);

  // What RedisSentinel.transform() does on every rediscovery pass while the
  // old master is down: changeNode() again before the previous connect settles.
  it('destroys the still-connecting subscriber so only the latest node keeps reconnecting', async () => {
    const { reconnectStrategy, stillRetrying, stopRetrying } = trackReconnects();
    const proxy = new PubSubProxy({ socket: { reconnectStrategy } }, () => {});
    const pending: Array<Promise<unknown>> = [];

    try {
      await proxy.changeNode(closedNode(7001));
      pending.push(proxy.subscribe('channel', () => {}).catch(() => {}));
      for (const port of [7002, 7003, 7004]) {
        await sleep(500);
        pending.push(proxy.changeNode(closedNode(port)).catch(() => {}));
      }

      await sleep(2000);
      assert.deepEqual(
        stillRetrying(),
        ['7004'],
        'a subscriber replaced while its connect is in flight must not keep reconnecting'
      );
    } finally {
      stopRetrying();
      proxy.destroy();
      await sleep(500);
      await Promise.all(pending);
    }
  });

  // A superseded connect's rejection must clear #state only when that client is
  // still current. Otherwise the next changeNode() returns early and the
  // subscriber is never moved.
  it('does not drop the current subscriber when a superseded connect gives up', async () => {
    const { attempts, reconnectStrategy, stopRetrying } = trackReconnects('7001');
    const proxy = new PubSubProxy({ socket: { reconnectStrategy } }, () => {});
    const pending: Array<Promise<unknown>> = [];

    try {
      await proxy.changeNode(closedNode(7001));
      pending.push(proxy.subscribe('channel', () => {}).catch(() => {}));
      await sleep(300);
      pending.push(proxy.changeNode(closedNode(7002)).catch(() => {}));
      await sleep(2000);
      pending.push(proxy.changeNode(closedNode(7003)).catch(() => {}));
      await sleep(1000);

      assert.equal(
        attempts.has('7003'),
        true,
        'changeNode(7003) must seat a client after the superseded 7001 connect gives up'
      );
    } finally {
      stopRetrying();
      proxy.destroy();
      await sleep(500);
      await Promise.all(pending);
    }
  });

  // The closed-port cases above never accept a connection, so they cannot see
  // a replacement that is already subscribed when the superseded connect fails.
  // Sequence: live subscription, move to a down node, queue another subscribe
  // while that connect is in backoff, move to a node that accepts, then let
  // the old backoff end.
  it('keeps the connected replacement when a superseded connect fails', async () => {
    const BACKOFF_MS = 300;
    const stub = await startRespStub();
    let onSocketError: (err: unknown) => void = () => {};
    const proxy = new PubSubProxy({
      maintNotifications: 'disabled',
      socket: {
        reconnectStrategy: () => BACKOFF_MS
      }
    }, err => onSocketError(err));

    const pending: Array<Promise<unknown>> = [];
    try {
      await proxy.changeNode(stub.node);
      await proxy.subscribe('old-channel', () => {});

      let sawDownError!: () => void;
      const downError = new Promise<void>(resolve => {
        sawDownError = resolve;
      });
      onSocketError = err => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('ECONNREFUSED')) sawDownError();
      };

      // Not awaited: changeNode() stays pending in the down node's backoff.
      pending.push(proxy.changeNode(closedNode(1)).catch(() => {}));
      await downError;

      let queuedError: unknown;
      pending.push(
        proxy.subscribe('queued-channel', () => {}).then(
          () => undefined,
          err => {
            queuedError = err;
          }
        )
      );

      await proxy.changeNode(stub.node);
      // The down client was destroyed mid-backoff. When that timer fires,
      // connect() rejects. Give it the full backoff plus a little slack.
      await sleep(BACKOFF_MS + 100);

      const open = stub.connections.filter(connection => !connection.socket.destroyed);
      assert.equal(
        open.length,
        1,
        'the replacement subscriber must not be destroyed when a superseded connect fails'
      );
      const channels = new Set(open[0].channels);
      assert.ok(
        channels.has('old-channel'),
        'the replacement must restore the subscription that was already live'
      );
      assert.ok(
        channels.has('queued-channel'),
        'the replacement must receive the subscribe that was queued on the down node'
      );
      assert.equal(
        queuedError,
        undefined,
        `the queued subscribe must resolve, got ${queuedError}`
      );
    } finally {
      onSocketError = () => {};
      proxy.destroy();
      stub.close();
      await sleep(50);
      await Promise.all(pending);
    }
  });
});

/**
 * One local socket that speaks just enough RESP for a subscriber handshake:
 * `HELLO` and `CLIENT` get `+OK`, `SUBSCRIBE` gets a RESP3 push per channel.
 */
async function startRespStub() {
  type Connection = {
    socket: net.Socket;
    channels: Array<string>;
  };

  const connections: Array<Connection> = [];
  const server = net.createServer(socket => {
    socket.on('error', () => {});
    const connection: Connection = { socket, channels: [] };
    connections.push(connection);

    let pending = Buffer.alloc(0);
    socket.on('data', (chunk: Buffer) => {
      pending = pending.length === 0 ? chunk : Buffer.concat([pending, chunk]);
      const parsed = takeRespCommands(pending);
      pending = parsed.rest;
      for (const args of parsed.commands) {
        const name = args[0]?.toLowerCase();
        if (name === 'subscribe' || name === 'psubscribe' || name === 'ssubscribe') {
          const channels = args.slice(1);
          connection.channels.push(...channels);
          for (const channel of channels) {
            socket.write(subscribePush(name, channel));
          }
          continue;
        }
        socket.write('+OK\r\n');
      }
    });
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('expected the RESP stub to listen on a TCP port');
  }

  return {
    connections,
    node: { host: '127.0.0.1', port: address.port },
    close() {
      for (const connection of connections) connection.socket.destroy();
      server.close();
    }
  };
}

function subscribePush(kind: string, channel: string) {
  return `>3\r\n${bulkString(kind)}${bulkString(channel)}:1\r\n`;
}

function bulkString(value: string) {
  return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
}

/** Pull complete RESP arrays of bulk strings out of a stream buffer. */
function takeRespCommands(buffer: Buffer) {
  const commands: Array<Array<string>> = [];
  let offset = 0;

  while (offset < buffer.length) {
    if (buffer[offset] !== 42 /* '*' */) break;

    const headerEnd = buffer.indexOf('\r\n', offset);
    if (headerEnd === -1) break;

    const count = Number(buffer.toString('utf8', offset + 1, headerEnd));
    let cursor = headerEnd + 2;
    const args: Array<string> = [];
    let complete = true;
    for (let i = 0; i < count; i++) {
      if (cursor >= buffer.length || buffer[cursor] !== 36 /* '$' */) {
        complete = false;
        break;
      }
      const argLineEnd = buffer.indexOf('\r\n', cursor);
      if (argLineEnd === -1) {
        complete = false;
        break;
      }
      const length = Number(buffer.toString('utf8', cursor + 1, argLineEnd));
      const start = argLineEnd + 2;
      const end = start + length;
      if (buffer.length < end + 2) {
        complete = false;
        break;
      }
      args.push(buffer.toString('utf8', start, end));
      cursor = end + 2;
    }
    if (!complete) break;

    commands.push(args);
    offset = cursor;
  }

  return {
    commands,
    rest: Buffer.from(buffer.subarray(offset))
  };
}
