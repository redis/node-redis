import { strict as assert } from 'node:assert';
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
});
