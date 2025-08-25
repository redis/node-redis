import { readFileSync } from "fs";

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

