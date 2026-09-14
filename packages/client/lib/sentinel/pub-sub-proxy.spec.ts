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
});
