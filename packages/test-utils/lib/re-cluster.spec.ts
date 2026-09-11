import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isExternalCluster,
  loadREClusterConnection,
  loadREConnection,
  resetREConnectionForTests
} from './re-cluster';

describe('external endpoint configuration', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnvironment)) delete process.env[key];
    }
    Object.assign(process.env, originalEnvironment);
    resetREConnectionForTests();
  });

  function configure(value: unknown, relative = false): string {
    const directory = mkdtempSync(join(tmpdir(), 'redis-endpoints-'));
    const file = join(directory, 'endpoints.json');
    writeFileSync(file, JSON.stringify(value), 'utf8');
    process.env.REDIS_ENDPOINTS_CONFIG_PATH = relative ? 'endpoints.json' : file;
    if (relative) process.env.INIT_CWD = directory;
    return directory;
  }

  it('loads the first standalone endpoint and every cluster root node', () => {
    const directory = configure({
      standalone: {
        tls: false,
        raw_endpoints: [{ dns_name: 'standalone', port: 6379 }]
      },
      cluster: {
        tls: true,
        username: 'user',
        password: 'secret',
        RESP: 2,
        version: '7.2.0',
        raw_endpoints: [
          { dns_name: 'cluster-a', port: 6379 },
          { dns_name: 'cluster-b', port: 6380 }
        ]
      }
    });
    try {
      assert.deepEqual(loadREConnection(), {
        host: 'standalone',
        port: 6379,
        tls: false,
        username: undefined,
        password: undefined
      });

      process.env.RE_DB_NAME = 'cluster';
      assert.equal(isExternalCluster(), false);
      assert.deepEqual(loadREClusterConnection(), {
        nodes: [
          { host: 'cluster-a', port: 6379 },
          { host: 'cluster-b', port: 6380 }
        ],
        tls: true,
        username: 'user',
        password: 'secret',
        RESP: 2,
        version: '7.2.0'
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('loads URL endpoints and resolves a relative path from INIT_CWD', () => {
    const directory = configure({
      cluster: {
        version: '7.2',
        endpoints: ['redis://cluster-a:6379', 'rediss://cluster-b:6380']
      }
    }, true);
    process.env.RE_DB_NAME = 'cluster';
    try {
      assert.deepEqual(loadREClusterConnection(), {
        nodes: [
          { host: 'cluster-a', port: 6379 },
          { host: 'cluster-b', port: 6380 }
        ],
        tls: true,
        username: undefined,
        password: undefined,
        RESP: undefined,
        version: '7.2'
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects an external cluster without an explicit version', () => {
    const directory = configure({ cluster: { raw_endpoints: [{ dns_name: 'cluster-a', port: 6379 }] } });
    process.env.RE_DB_NAME = 'cluster';
    try {
      assert.throws(() => loadREClusterConnection(), /version.*required/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('preserves the original load failure on repeated access', () => {
    process.env.REDIS_ENDPOINTS_CONFIG_PATH = join(tmpdir(), 'missing-redis-endpoints.json');
    assert.throws(() => loadREConnection(), /ENOENT/);
    let secondError: unknown;
    try {
      loadREConnection();
    } catch (error) {
      secondError = error;
    }
    assert.match(String(secondError), /ENOENT/);
  });
});
