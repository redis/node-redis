import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { PubSubProxy } from './pub-sub-proxy';
import { PUBSUB_TYPE } from '../client/pub-sub';
import RedisClient from '../client';
import type { RedisServerDocker } from '@redis/test-utils';

const execFileAsync = promisify(execFile);

describe('sentinel pub-sub-proxy', function () {
  this.timeout(30_000);

  let server: RedisServerDocker;

  before(async function () {
    this.timeout(120_000);
    server = await testUtils.spawnRedisServer({ serverArguments: [] });
  });

  after(async () => {
    if (server) await execFileAsync('docker', ['rm', '-f', server.dockerId]);
  });

  it('a subscribe still mid-connect survives extractListeners and adopts on the next member', async () => {
    const node = { host: '127.0.0.1', port: server.port };
    const proxyA = new PubSubProxy({}, () => {});
    await proxyA.changeNode(node);

    const received: Array<string> = [];
    const listener = (message: string) => { received.push(message); };
    // first subscribe: the pub/sub client is still connecting when we extract
    const subscribePromise = proxyA.subscribe('moving-channel', listener);
    const extracted = proxyA.extractListeners();

    assert.ok(
      extracted[PUBSUB_TYPE.CHANNELS].get('moving-channel')?.strings.has(listener),
      'the in-flight subscribe must be part of the extracted snapshot'
    );
    await subscribePromise; // the abandoned dispatch settles quietly

    const proxyB = new PubSubProxy({}, () => {});
    await proxyB.changeNode(node);
    await proxyB.adoptListeners(extracted);

    const publisher = RedisClient.create({ socket: node });
    await publisher.connect();
    try {
      const deadline = Date.now() + 5_000;
      while (received.length === 0 && Date.now() < deadline) {
        await publisher.publish('moving-channel', 'hello');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      publisher.destroy();
      proxyB.destroy();
    }
    assert.equal(received[0], 'hello', 'the moved subscription must deliver on the adopting member');
  });

  it('extraction with a settled subscription plus one in flight carries both', async () => {
    const node = { host: '127.0.0.1', port: server.port };
    const proxy = new PubSubProxy({}, () => {});
    await proxy.changeNode(node);

    const settled = () => {};
    const inFlight = () => {};
    await proxy.subscribe('settled-channel', settled);
    // second subscribe rides a fresh dispatch; extract before it settles
    const subscribePromise = proxy.pSubscribe('flight.*', inFlight);
    const extracted = proxy.extractListeners();
    await subscribePromise;

    assert.ok(extracted[PUBSUB_TYPE.CHANNELS].get('settled-channel')?.strings.has(settled));
    assert.ok(extracted[PUBSUB_TYPE.PATTERNS].get('flight.*')?.strings.has(inFlight));
  });

  it('a subscribe stays but an in-flight unsubscribe is dropped from the extracted snapshot', async () => {
    const node = { host: '127.0.0.1', port: server.port };
    const proxy = new PubSubProxy({}, () => {});
    await proxy.changeNode(node);
    const stay = () => {};
    const leave = () => {};
    await proxy.subscribe('stay', stay);
    await proxy.subscribe('leave', leave);

    // start the unsubscribe but do NOT await it — its UNSUBSCRIBE is in flight
    // on the inner client when the failover extract runs
    const leaving = proxy.unsubscribe('leave', leave);
    const extracted = proxy.extractListeners();

    assert.ok(extracted[PUBSUB_TYPE.CHANNELS].get('stay')?.strings.has(stay), 'the kept channel must move');
    assert.equal(
      extracted[PUBSUB_TYPE.CHANNELS].has('leave'), false,
      'a channel being unsubscribed must not be resurrected on the new member'
    );
    await leaving.catch(() => {}); // the abandoned dispatch settles quietly post-destroy
  });

  it('unsubscribing everything clears the adopted snapshot — no ghost on the next extract', async () => {
    const node = { host: '127.0.0.1', port: server.port };
    const source = new PubSubProxy({}, () => {});
    await source.changeNode(node);
    await source.subscribe('adopted', () => {});

    // move the subscription to a second proxy (adopt populates #subscriptions)
    const adopter = new PubSubProxy({}, () => {});
    await adopter.changeNode(node);
    await adopter.adoptListeners(source.extractListeners());

    // the user then unsubscribes everything on the adopter
    await adopter.unsubscribe();

    // a later move must find nothing to carry — the stale snapshot is gone
    const extracted = adopter.extractListeners();
    assert.equal(extracted[PUBSUB_TYPE.CHANNELS].size, 0, 'no ghost channel may survive unsubscribe-all');
    adopter.destroy();
  });
});
