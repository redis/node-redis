export type ActionType =
  | "dmc_restart"
  | "failover"
  | "reshard"
  | "sequence_of_actions"
  | "network_failure"
  | "execute_rlutil_command"
  | "execute_rladmin_command"
  | "migrate"
  | "bind"
  | "update_cluster_config"
  | "shard_failure"
  | "node_failure"
  | "node_remove"
  | "proxy_failure"
  | "cluster_failure"
  | "delete_database"
  | "create_database";

export interface ActionRequest {
  type: ActionType;
  parameters?: {
    bdb_id?: string;
    [key: string]: unknown;
  };
}

export interface ActionStatus {
  status: string;
  error: unknown;
  output: string;
}

export interface DatabaseModule {
  module_name: string;
  // Add additional module properties as needed based on your Go struct
  [key: string]: unknown;
}

export interface ShardKeyRegexPattern {
  regex: string;
  // Add additional pattern properties as needed based on your Go struct
  [key: string]: unknown;
}

export interface CreateDatabaseConfig {
  name: string;
  port: number;
  memory_size: number;
  replication: boolean;
  eviction_policy: string;
  sharding: boolean;
  auto_upgrade: boolean;
  shards_count: number;
  module_list?: DatabaseModule[];
  oss_cluster: boolean;
  oss_cluster_api_preferred_ip_type?: string;
  proxy_policy?: string;
  shards_placement?: string;
  shard_key_regex?: ShardKeyRegexPattern[];
}

export interface DatabaseConfig {
  host: string;
  port: number;
  password: string;
  username: string;
  tls: boolean;
  bdbId: number;
}

export interface IFaultInjectorClient {
  triggerAction(action: ActionRequest): Promise<ActionStatus>;
}
