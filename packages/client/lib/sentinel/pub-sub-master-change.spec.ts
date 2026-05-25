import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import RedisClient from '../client';
import { PubSubProxy } from './pub-sub-proxy';
import { RedisSentinelInternal } from './index';

describe('pubsub master change applies nodeAddressMap', () => {
  const RAW_HOST = '10.0.0.99';
  const RAW_PORT = 6390;
  const MAPPED_HOST = 'external.example.com';
  const MAPPED_PORT = 16390;

  let changeNodeStub: sinon.SinonStub;
  let clientConnectStub: sinon.SinonStub;
  let internal: RedisSentinelInternal<{}, {}, {}, 2, {}>;

  beforeEach(() => {
    changeNodeStub = sinon.stub(PubSubProxy.prototype, 'changeNode').resolves();
    // The stub only needs to short-circuit the TCP connect; the resolved value is unused.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clientConnectStub = sinon.stub(RedisClient.prototype, 'connect').resolves(undefined as any);

    internal = new RedisSentinelInternal<{}, {}, {}, 2, {}>({
      name: 'mymaster',
      sentinelRootNodes: [{ host: '127.0.0.1', port: 26379 }],
      nodeAddressMap: {
        [`${RAW_HOST}:${RAW_PORT}`]: { host: MAPPED_HOST, port: MAPPED_PORT }
      }
    });
    internal.on('error', () => { });
  });

  afterEach(() => {
    changeNodeStub.restore();
    clientConnectStub.restore();
  });

  it('passes the mapped address (not the raw sentinel-reported one) to PubSubProxy.changeNode', async () => {
    await internal.transform({
      sentinelList: [],
      epoch: 0,
      sentinelToOpen: undefined,
      masterToOpen: { host: RAW_HOST, port: RAW_PORT },
      replicasToClose: [],
      replicasToOpen: new Map()
    });

    assert.equal(changeNodeStub.callCount, 1, 'PubSubProxy.changeNode should be called exactly once');
    assert.deepEqual(
      changeNodeStub.firstCall.args[0],
      { host: MAPPED_HOST, port: MAPPED_PORT },
      'pubsub proxy must reconnect to the mapped address after a sentinel failover'
    );
  });
});
