export const CreateDatabaseConfigType = {
  CLUSTER: "cluster",
} as const;

type ConfigType =
  (typeof CreateDatabaseConfigType)[keyof typeof CreateDatabaseConfigType];

// 10000-19999
const randomPort = () => Math.floor(Math.random() * (19999 - 10000) + 10000);

const DB_CONFIGS = {
  [CreateDatabaseConfigType.CLUSTER]: (
    name: string,
    port: number = randomPort(),
    size: number = 1073741824 // 1GB
  ) => {
    return {
      name: name,
      port: port,
      memory_size: size,
      replication: true,
      eviction_policy: "noeviction",
      sharding: true,
      auto_upgrade: true,
      shards_count: 3,
      module_list: [
        {
          module_args: "",
          module_name: "ReJSON",
        },
        {
          module_args: "",
          module_name: "search",
        },
        {
          module_args: "",
          module_name: "timeseries",
        },
        {
          module_args: "",
          module_name: "bf",
        },
      ],
      oss_cluster: true,
      oss_cluster_api_preferred_ip_type: "external",
      proxy_policy: "all-master-shards",
      shards_placement: "sparse",
      shard_key_regex: [
        {
          regex: ".*\\{(?<tag>.*)\\}.*",
        },
        {
          regex: "(?<tag>.*)",
        },
      ],
    };
  },
};

export const getCreateDatabaseConfig = (type: ConfigType, name: string) => {
  return DB_CONFIGS[type](name);
};
