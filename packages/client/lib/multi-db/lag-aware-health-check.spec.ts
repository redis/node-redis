import { strict as assert } from 'node:assert';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { LagAwareHealthCheck } from './lag-aware-health-check';
import type { HealthCheckTarget } from './health-check';

const TARGET: HealthCheckTarget = {
  id: 'db-0',
  sendCommand: () => Promise.reject(new Error('the REST check must not touch the data path'))
};

describe('LagAwareHealthCheck', () => {
  const requests: Array<{ url: string; authorization?: string }> = [];
  let server: Server;
  let endpoint: string;
  let status = 200;
  let hang = false;

  before(async () => {
    server = createServer((req, res) => {
      requests.push({ url: req.url!, authorization: req.headers.authorization });
      if (hang) return; // never respond — the request must time out client-side
      res.statusCode = status;
      res.end('{}');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    endpoint = `http://127.0.0.1:${address.port}`;
  });

  after(() => {
    server.close();
    server.closeAllConnections();
  });

  beforeEach(() => {
    requests.length = 0;
    status = 200;
    hang = false;
  });

  it('passes on an available database and sends uid, lag params and basic auth', async () => {
    const check = new LagAwareHealthCheck({
      restEndpoint: endpoint,
      bdbUid: 42,
      lagTolerance: 1234,
      credentials: { username: 'user', password: 'pass' }
    });

    assert.equal(await check.probe(TARGET), true);
    assert.equal(requests.length, 1);
    assert.equal(
      requests[0].url,
      '/v1/bdbs/42/availability?extend_check=lag&availability_lag_tolerance_ms=1234'
    );
    assert.equal(
      requests[0].authorization,
      `Basic ${Buffer.from('user:pass').toString('base64')}`
    );
  });

  it('applies the 5s default lag tolerance', async () => {
    const check = new LagAwareHealthCheck({ restEndpoint: endpoint, bdbUid: 1 });
    await check.probe(TARGET);
    assert.match(requests[0].url, /availability_lag_tolerance_ms=5000/);
  });

  it('fails when the database is unavailable or lagging', async () => {
    status = 503;
    const check = new LagAwareHealthCheck({ restEndpoint: endpoint, bdbUid: 1 });
    assert.equal(await check.probe(TARGET), false);
  });

  it('fails on rejected credentials', async () => {
    status = 401;
    const check = new LagAwareHealthCheck({
      restEndpoint: endpoint,
      bdbUid: 1,
      credentials: { username: 'user', password: 'wrong' }
    });
    assert.equal(await check.probe(TARGET), false);
  });

  it('fails when the REST API does not answer within requestTimeout', async () => {
    hang = true;
    const check = new LagAwareHealthCheck({
      restEndpoint: endpoint,
      bdbUid: 1,
      requestTimeout: 100
    });
    assert.equal(await check.probe(TARGET), false);
  });

  it('fails on an unreachable REST endpoint', async () => {
    const check = new LagAwareHealthCheck({
      restEndpoint: 'http://127.0.0.1:1',
      bdbUid: 1,
      requestTimeout: 500
    });
    assert.equal(await check.probe(TARGET), false);
  });

  it('resolves endpoint and uid per database id', async () => {
    const check = new LagAwareHealthCheck({
      restEndpoint: databaseId => {
        assert.equal(databaseId, 'db-0');
        return endpoint;
      },
      bdbUid: databaseId => `uid-of-${databaseId}`
    });
    assert.equal(await check.probe(TARGET), true);
    assert.match(requests[0].url, /^\/v1\/bdbs\/uid-of-db-0\/availability/);
  });
});
