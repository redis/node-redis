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

  if (!process.env.FAULT_INJECTION_API_URL) {
    throw new Error("FAULT_INJECTION_API_URL environment variable must be set");
  }

  return {
    redisEndpointsConfigPath: process.env.REDIS_ENDPOINTS_CONFIG_PATH,
    faultInjectorUrl: process.env.FAULT_INJECTION_API_URL,
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
  databaseName?: string
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

// TODO this should be moved in the tests utils package
export async function blockSetImmediate(fn: () => Promise<unknown>) {
  let setImmediateStub: any;

  try {
    setImmediateStub = stub(global, "setImmediate");
    setImmediateStub.callsFake(() => {
      //Dont call the callback, effectively blocking execution
    });
    await fn();
  } finally {
    if (setImmediateStub) {
      setImmediateStub.restore();
    }
  }
}

/**
 * Factory class for creating and managing Redis clients
 */
export class ClientFactory {
  private readonly clients = new Map<
    string,
    ReturnType<typeof createClient<any, any, any, any>>
  >();

  constructor(private readonly config: RedisConnectionConfig) {}

  /**
   * Creates a new client with the specified options and connects it to the database
   * @param key - The key to store the client under
   * @param options - Optional client options
   * @returns The created and connected client
   */
  async create(key: string, options: Partial<RedisClientOptions> = {}) {
    const client = createClient({
      socket: {
        host: this.config.host,
        port: this.config.port,
        ...(this.config.tls === true ? { tls: true } : {}),
      },
      password: this.config.password,
      username: this.config.username,
      RESP: 3,
      maintPushNotifications: "auto",
      maintMovingEndpointType: "auto",
      ...options,
    });

    client.on("error", (err: Error) => {
      throw new Error(`Client error: ${err.message}`);
    });

    await client.connect();

    this.clients.set(key, client);

    return client;
  }

  /**
   * Gets an existing client by key or the first one if no key is provided
   * @param key - The key of the client to retrieve
   * @returns The client if found, undefined otherwise
   */
  get(key?: string) {
    if (key) {
      return this.clients.get(key);
    }

    // Get the first one if no key is provided
    return this.clients.values().next().value;
  }

  /**
   * Destroys all created clients
   */
  destroyAll() {
    this.clients.forEach((client) => {
      if (client && client.isOpen) {
        client.destroy();
      }
    });
  }
}
