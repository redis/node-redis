import { readFileSync } from 'node:fs';

interface RawEndpoint {
  dns_name: string;
  port: number;
}

interface REDatabaseConfig {
  username?: string;
  password?: string;
  tls: boolean;
  raw_endpoints?: Array<RawEndpoint>;
  endpoints?: Array<string>;
}

type REDatabasesConfig = Record<string, REDatabaseConfig>;

export interface REConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
}

/**
 * Whether the suite should target an external managed Redis Enterprise database
 * (set by the cae-client-testing integration pipeline) instead of spawning local
 * Docker servers.
 */
export function isReCluster(): boolean {
  return (process.env.RE_CLUSTER ?? '').toLowerCase() === 'true';
}

let cached: REConnection | undefined;

/**
 * Resolves the managed Redis Enterprise database the suite should target, reading
 * the database named by RE_DB_NAME (default "standalone") from the endpoints config
 * at REDIS_ENDPOINTS_CONFIG_PATH - the same format consumed by the scenario tests.
 */
export function loadREConnection(): REConnection {
  if (cached) return cached;

  const path = process.env.REDIS_ENDPOINTS_CONFIG_PATH;
  if (!path) {
    throw new Error('REDIS_ENDPOINTS_CONFIG_PATH must be set when RE_CLUSTER=true');
  }

  const data = JSON.parse(readFileSync(path, 'utf-8')) as REDatabasesConfig;
  const name = process.env.RE_DB_NAME || 'standalone';
  const db = data[name] ?? Object.values(data)[0];
  if (!db) {
    throw new Error(`Database ${name} not found in ${path}`);
  }

  let host: string;
  let port: number;
  if (db.raw_endpoints && db.raw_endpoints.length > 0) {
    host = db.raw_endpoints[0].dns_name;
    port = db.raw_endpoints[0].port;
  } else if (db.endpoints && db.endpoints.length > 0) {
    const parsed = new URL(db.endpoints[0]);
    host = parsed.hostname;
    port = parsed.port ? Number(parsed.port) : parsed.protocol === 'rediss:' ? 6380 : 6379;
  } else {
    throw new Error(`No endpoints found for database ${name} in ${path}`);
  }

  cached = {
    host,
    port,
    username: db.username || undefined,
    password: db.password || undefined,
    tls: db.tls
  };
  return cached;
}
