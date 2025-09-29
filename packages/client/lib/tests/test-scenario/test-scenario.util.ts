import { readFileSync } from "fs";
import { createClient, RedisClientOptions } from "../../..";
import { stub } from "sinon";

type DatabaseEndpoint = {
  addr: string[];
  addr_type: string;
  dns_name: string;
  oss_cluster_api_preferred_endpoint_type: string;
  oss_cluster_api_preferred_ip_type: string;
  port: number;
  proxy_policy: string;
  uid: string;
};

type DatabaseConfig = {
  bdb_id: number;
  username: string;
  password: string;
  tls: boolean;
  raw_endpoints: DatabaseEndpoint[];
  endpoints: string[];
};

type DatabasesConfig = {
  [databaseName: string]: DatabaseConfig;
};

type EnvConfig = {
  redisEndpointsConfigPath: string;
  faultInjectorUrl: string;
};

/**
 * Reads environment variables required for the test scenario
 * @returns Environment configuration object
 * @throws Error if required environment variables are not set
 */
export function getEnvConfig(): EnvConfig {
  if (!process.env.REDIS_ENDPOINTS_CONFIG_PATH) {
    throw new Error(
      "REDIS_ENDPOINTS_CONFIG_PATH environment variable must be set"
    );
  }

  if (!process.env.RE_FAULT_INJECTOR_URL) {
    throw new Error("RE_FAULT_INJECTOR_URL environment variable must be set");
  }

  return {
    redisEndpointsConfigPath: process.env.REDIS_ENDPOINTS_CONFIG_PATH,
    faultInjectorUrl: process.env.RE_FAULT_INJECTOR_URL,
  };
}

/**
 * Reads database configuration from a file
 * @param filePath - The path to the database configuration file
 * @returns Parsed database configuration object
 * @throws Error if file doesn't exist or JSON is invalid
 */
export function getDatabaseConfigFromEnv(filePath: string): DatabasesConfig {
  try {
    const fileContent = readFileSync(filePath, "utf8");
    return JSON.parse(fileContent) as DatabasesConfig;
  } catch (error) {
    throw new Error(`Failed to read or parse database config from ${filePath}`);
  }
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls: boolean;
  bdbId: number;
}

/**
 * Gets Redis connection parameters for a specific database
 * @param databasesConfig - The parsed database configuration object
 * @param databaseName - Optional name of the database to retrieve (defaults to the first one)
 * @returns Redis connection configuration with host, port, username, password, and tls
 * @throws Error if the specified database is not found in the configuration
 */
export function getDatabaseConfig(
  databasesConfig: DatabasesConfig,
  databaseName = process.env.DATABASE_NAME
): RedisConnectionConfig {
  const dbConfig = databaseName
    ? databasesConfig[databaseName]
    : Object.values(databasesConfig)[0];

  if (!dbConfig) {
    throw new Error(
      `Database ${databaseName ? databaseName : ""} not found in configuration`
    );
  }

  const endpoint = dbConfig.raw_endpoints[0]; // Use the first endpoint

  return {
    host: endpoint.dns_name,
    port: endpoint.port,
    username: dbConfig.username,
    password: dbConfig.password,
    tls: dbConfig.tls,
    bdbId: dbConfig.bdb_id,
  };
}

/**
 * Executes the provided function in a context where setImmediate is stubbed to not do anything.
 * This blocks setImmediate callbacks from executing
 *
 * @param command - The command to execute
 * @returns The error and duration of the command execution
 */
export async function blockCommand(command: () => Promise<unknown>) {
  let error: any;

  const start = performance.now();

  let setImmediateStub: any;

  try {
    setImmediateStub = stub(global, "setImmediate");
    setImmediateStub.callsFake(() => {
      //Dont call the callback, effectively blocking execution
    });
    await command();
  } catch (err: any) {
    error = err;
  } finally {
    if (setImmediateStub) {
      setImmediateStub.restore();
    }
  }

  return {
    error,
    duration: performance.now() - start,
  };
}

/**
 * Creates a test client with the provided configuration, connects it and attaches an error handler listener
 * @param clientConfig - The Redis connection configuration
 * @param options - Optional client options
 * @returns The created Redis client
 */
export async function createTestClient(
  clientConfig: RedisConnectionConfig,
  options: Partial<RedisClientOptions> = {}
) {
  const client = createClient({
    socket: {
      host: clientConfig.host,
      port: clientConfig.port,
      ...(clientConfig.tls === true ? { tls: true } : {}),
    },
    password: clientConfig.password,
    username: clientConfig.username,
    RESP: 3,
    maintNotifications: "auto",
    maintEndpointType: "auto",
    ...options,
  });

  await client.connect();

  return client;
}
