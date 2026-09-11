import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RESPVersion = 2 | 3;

interface RawEndpoint {
  dns_name: string;
  port: number;
}

interface REDatabaseConfig {
  username?: string | null;
  password?: string | null;
  tls?: boolean;
  RESP?: RESPVersion;
  version?: string;
  raw_endpoints?: Array<RawEndpoint>;
  endpoints?: Array<string>;
}

type REDatabasesConfig = Record<string, REDatabaseConfig>;

interface ResolvedEndpoint {
  host: string;
  port: number;
  tls: boolean;
}

export interface REConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
}

export interface REClusterConnection {
  nodes: Array<{ host: string; port: number }>;
  username?: string;
  password?: string;
  tls: boolean;
  RESP?: RESPVersion;
  version: string;
}

type LoadState =
  | { status: 'unloaded' }
  | { status: 'loaded'; path: string; databases: REDatabasesConfig }
  | { status: 'failed'; error: Error };

let loadState: LoadState = { status: 'unloaded' };

export function isReCluster(): boolean {
  return (process.env.RE_CLUSTER ?? '').toLowerCase() === 'true';
}

export function isExternalCluster(): boolean {
  return (process.env.REDIS_EXTERNAL_CLUSTER ?? '').toLowerCase() === 'true';
}

function getConfigPath(): string {
  const configuredPath = process.env.REDIS_ENDPOINTS_CONFIG_PATH;
  if (!configuredPath) {
    throw new Error('REDIS_ENDPOINTS_CONFIG_PATH must be set when external testing is enabled');
  }

  return resolve(process.env.INIT_CWD || process.cwd(), configuredPath);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readDatabases(): { path: string; databases: REDatabasesConfig } {
  if (loadState.status === 'loaded') return loadState;
  if (loadState.status === 'failed') throw loadState.error;

  try {
    const path = getConfigPath();
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (!isRecord(parsed)) {
      throw new Error(`External endpoints config ${path} must contain a JSON object`);
    }

    loadState = { status: 'loaded', path, databases: parsed as REDatabasesConfig };
    return loadState;
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    loadState = { status: 'failed', error: failure };
    throw failure;
  }
}

function getDatabase(): { path: string; database: REDatabaseConfig } {
  const { path, databases } = readDatabases();
  const name = process.env.RE_DB_NAME || 'standalone';
  const database = databases[name] ?? Object.values(databases)[0];
  if (!database || !isRecord(database)) {
    throw new Error(`Database ${name} not found in ${path}`);
  }
  return { path, database };
}

function resolveCredentials(database: REDatabaseConfig, path: string) {
  const { username, password } = database;
  if (username !== undefined && username !== null && typeof username !== 'string') {
    throw new Error(`Database credentials in ${path} must be strings`);
  }
  if (password !== undefined && password !== null && typeof password !== 'string') {
    throw new Error(`Database credentials in ${path} must be strings`);
  }
  if (database.tls !== undefined && typeof database.tls !== 'boolean') {
    throw new Error(`Database tls in ${path} must be a boolean`);
  }
  if (database.RESP !== undefined && database.RESP !== 2 && database.RESP !== 3) {
    throw new Error(`Database RESP in ${path} must be 2 or 3`);
  }

  return {
    username: username || undefined,
    password: password || undefined,
    tls: database.tls
  };
}

function parsePort(port: unknown, path: string): number {
  if (!Number.isInteger(port) || (port as number) < 1 || (port as number) > 65535) {
    throw new Error(`Endpoint port in ${path} must be an integer between 1 and 65535`);
  }
  return port as number;
}

function parseHost(host: unknown, path: string): string {
  if (typeof host !== 'string' || host.trim().length === 0) {
    throw new Error(`Endpoint host in ${path} must be a non-empty string`);
  }
  return host.trim();
}

function resolveEndpoints(database: REDatabaseConfig, path: string): Array<ResolvedEndpoint> {
  if (database.raw_endpoints !== undefined && !Array.isArray(database.raw_endpoints)) {
    throw new Error(`Endpoints in ${path}.raw_endpoints must be an array`);
  }
  if (Array.isArray(database.raw_endpoints) && database.raw_endpoints.length > 0) {
    return database.raw_endpoints.map((endpoint, index) => {
      if (!isRecord(endpoint)) {
        throw new Error(`Endpoint ${index} in ${path}.raw_endpoints must be an object`);
      }
      return {
        host: parseHost(endpoint.dns_name, `${path}.raw_endpoints[${index}]`),
        port: parsePort(endpoint.port, `${path}.raw_endpoints[${index}]`),
        tls: false
      };
    });
  }

  if (database.endpoints !== undefined) {
    if (!Array.isArray(database.endpoints) || database.endpoints.length === 0) {
      throw new Error(`No endpoints found in ${path}.endpoints`);
    }
    return database.endpoints.map((endpoint, index) => {
      if (typeof endpoint !== 'string' || endpoint.trim().length === 0) {
        throw new Error(`Endpoint ${index} in ${path}.endpoints must be a URL`);
      }
      let parsed: URL;
      try {
        parsed = new URL(endpoint);
      } catch (error) {
        throw new Error(`Endpoint ${index} in ${path}.endpoints is invalid: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
        throw new Error(`Endpoint ${index} in ${path}.endpoints must use redis: or rediss:`);
      }
      return {
        host: parseHost(parsed.hostname, `${path}.endpoints[${index}]`),
        port: parsePort(parsed.port ? Number(parsed.port) : parsed.protocol === 'rediss:' ? 6380 : 6379, `${path}.endpoints[${index}]`),
        tls: parsed.protocol === 'rediss:'
      };
    });
  }

  throw new Error(`No endpoints found for database in ${path}`);
}

export function loadREConnection(): REConnection {
  const { path, database } = getDatabase();
  const endpoints = resolveEndpoints(database, path);
  const credentials = resolveCredentials(database, path);
  const endpoint = endpoints[0];
  return {
    host: endpoint.host,
    port: endpoint.port,
    username: credentials.username,
    password: credentials.password,
    tls: credentials.tls ?? endpoint.tls
  };
}

export function loadREClusterConnection(): REClusterConnection {
  const { path, database } = getDatabase();
  const endpoints = resolveEndpoints(database, path);
  const credentials = resolveCredentials(database, path);
  if (typeof database.version !== 'string' || database.version.trim().length === 0) {
    throw new Error(`Database version in ${path} is required for external cluster testing`);
  }

  return {
    nodes: endpoints.map(({ host, port }) => ({ host, port })),
    username: credentials.username,
    password: credentials.password,
    tls: credentials.tls ?? endpoints.some(endpoint => endpoint.tls),
    RESP: database.RESP,
    version: database.version
  };
}

export function resetREConnectionForTests(): void {
  loadState = { status: 'unloaded' };
}
