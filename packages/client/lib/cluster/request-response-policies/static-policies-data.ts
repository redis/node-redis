import { ModulePolicyRecords } from "./types";

export const POLICIES: ModulePolicyRecords = {
  "std": {
    "getrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "incr": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zlexcount": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hincrbyfloat": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zinterstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zpopmax": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zdiff": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "waitaof": {
      "request": "all_shards",
      "response": "agg_min",
      "isKeyless": true
    },
    "psubscribe": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "geodist": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hdel": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "type": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "flushdb": {
      "request": "all_shards",
      "response": "all_succeeded",
      "isKeyless": true
    },
    "lpos": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xreadgroup": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pttl": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sdiff": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hkeys": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "eval": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "substr": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zremrangebyrank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zcount": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "memory": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "purge": {
          "request": "all_shards",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "doctor": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "stats": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "malloc-stats": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "usage": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        }
      }
    },
    "hgetdel": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hpersist": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "persist": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "llen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "info": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "failover": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "hello": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "exec": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "hpexpiretime": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "acl": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "deluser": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "genpass": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "dryrun": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "save": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "cat": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "users": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "whoami": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "list": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "load": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "log": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "setuser": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "getuser": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "sort": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "latency": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "history": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "reset": {
          "request": "all_nodes",
          "response": "agg_sum",
          "isKeyless": true
        },
        "doctor": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "histogram": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "latest": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "graph": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "zincrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sync": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "rpushx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xtrim": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "auth": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "echo": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "georadiusbymember": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zcard": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "setnx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hsetex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "restore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "geoadd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "subscribe": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "getex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zremrangebyscore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hmset": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zremrangebylex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "watch": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "fcall": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lset": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hpttl": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zintercard": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sort_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zrandmember": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "discard": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zpopmin": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "scard": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hrandfield": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hstrlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xinfo": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "groups": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "consumers": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "stream": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "flushall": {
      "request": "all_shards",
      "response": "all_succeeded",
      "isKeyless": true
    },
    "linsert": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "geopos": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pexpiretime": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sdiffstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "ping": {
      "request": "all_shards",
      "response": "all_succeeded",
      "isKeyless": true
    },
    "zscan": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hget": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zunionstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "ssubscribe": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zrevrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "slaveof": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "bitcount": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "evalsha_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lpushx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sinterstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "touch": {
      "request": "multi_shard",
      "response": "agg_sum",
      "isKeyless": false
    },
    "bgsave": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "pfcount": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zdiffstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pubsub": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "shardnumsub": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "numpat": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "numsub": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "channels": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "shardchannels": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "lindex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "georadiusbymember_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "geohash": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xgroup": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "setid": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "create": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "destroy": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "delconsumer": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "createconsumer": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        }
      }
    },
    "xadd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sscan": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "randomkey": {
      "request": "all_shards",
      "response": "special",
      "isKeyless": true
    },
    "bzpopmax": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "bitfield_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "ttl": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hsetnx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "rename": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "shutdown": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "strlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hpexpireat": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "slowlog": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "get": {
          "request": "all_nodes",
          "response": "default-keyless",
          "isKeyless": true
        },
        "reset": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "len": {
          "request": "all_nodes",
          "response": "agg_sum",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "setex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xack": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "client": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "caching": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "setinfo": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "setname": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "list": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "kill": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "no-evict": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "reply": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "tracking": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "unblock": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "trackinginfo": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "unpause": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "info": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "id": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "getredir": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "pause": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "getname": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "no-touch": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "unsubscribe": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "pexpireat": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hgetall": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "multi": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zrevrangebyscore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "psetex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xsetid": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "decr": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "rpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xautoclaim": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zadd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zrangestore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "get": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "blpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "replconf": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "keys": {
      "request": "all_shards",
      "response": "default-keyless",
      "isKeyless": true
    },
    "command": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "list": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "getkeysandflags": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "info": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "count": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "getkeys": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "docs": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "exists": {
      "request": "multi_shard",
      "response": "agg_sum",
      "isKeyless": false
    },
    "sismember": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "function": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "dump": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "delete": {
          "request": "all_shards",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "stats": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "restore": {
          "request": "all_shards",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "list": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "kill": {
          "request": "all_shards",
          "response": "one_succeeded",
          "isKeyless": true
        },
        "load": {
          "request": "all_shards",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "flush": {
          "request": "all_shards",
          "response": "all_succeeded",
          "isKeyless": true
        }
      }
    },
    "xread": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "rpush": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "append": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "set": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "move": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "expireat": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pexpire": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "brpoplpush": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "del": {
      "request": "multi_shard",
      "response": "agg_sum",
      "isKeyless": false
    },
    "lmpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "setrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sunsubscribe": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "migrate": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "scan": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "lcs": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "quit": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "cluster": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "addslotsrange": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "delslots": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "setslot": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "slots": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "links": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "delslotsrange": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "addslots": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "keyslot": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "meet": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "countkeysinslot": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "count-failure-reports": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "shards": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "myshardid": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "myid": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "reset": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "flushslots": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "slaves": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "info": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "replicate": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "nodes": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "failover": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "saveconfig": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "getkeysinslot": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "set-config-epoch": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "bumpepoch": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "replicas": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "forget": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "spop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xpending": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sunionstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "select": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "sintercard": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "srandmember": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "bzmpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pfadd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "msetnx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "expiretime": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "script": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "load": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "kill": {
          "request": "all_shards",
          "response": "one_succeeded",
          "isKeyless": true
        },
        "exists": {
          "request": "all_shards",
          "response": "agg_logical_and",
          "isKeyless": true
        },
        "flush": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "debug": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "zrem": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "save": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "smove": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "spublish": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "fcall_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lrem": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "blmove": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lolwut": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "bzpopmin": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hexpire": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "ltrim": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "asking": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zrevrangebylex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "restore-asking": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "setbit": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "smembers": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "expire": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hexpireat": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "srem": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "httl": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lastsave": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "hmget": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hexists": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "module": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "list": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "unload": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "load": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "loadex": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "sadd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "monitor": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "geosearch": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "copy": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lmove": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "publish": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zscore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "bgrewriteaof": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zunion": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hpexpire": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "config": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "set": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "resetstat": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        },
        "get": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "rewrite": {
          "request": "all_nodes",
          "response": "all_succeeded",
          "isKeyless": true
        }
      }
    },
    "punsubscribe": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zrangebylex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "reset": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "xclaim": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "geosearchstore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sinter": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pfdebug": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hscan": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "georadius_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "unwatch": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "unlink": {
      "request": "multi_shard",
      "response": "agg_sum",
      "isKeyless": false
    },
    "renamenx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "brpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zrevrank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "incrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hset": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "object": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "encoding": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "refcount": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "idletime": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "freq": {
          "request": "default-keyed",
          "response": "default-keyed",
          "isKeyless": false
        },
        "help": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    },
    "time": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zrangebyscore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "rpoplpush": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hincrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zinter": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "role": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "zrank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "pfselftest": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "hexpiretime": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "incrbyfloat": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zmscore": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "zmpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "smismember": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "xrevrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "bitpos": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "hgetex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "readonly": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "readwrite": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "pfmerge": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "dbsize": {
      "request": "all_shards",
      "response": "agg_sum",
      "isKeyless": true
    },
    "dump": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mget": {
      "request": "multi_shard",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mset": {
      "request": "multi_shard",
      "response": "all_succeeded",
      "isKeyless": false
    },
    "wait": {
      "request": "all_shards",
      "response": "agg_min",
      "isKeyless": true
    },
    "xdel": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "evalsha": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "bitop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "psync": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "getbit": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "georadius": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "getdel": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "swapdb": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "debug": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "hvals": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "lpush": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "replicaof": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "eval_ro": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "getset": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "decrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "bitfield": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "blmpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "sunion": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "FT": {
    "ALIASADD": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "ALIASUPDATE": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SPELLCHECK": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "DICTADD": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "_DROPIFX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "DROP": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "EXPLAINCLI": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SUGGET": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "SYNADD": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "TAGVALS": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "EXPLAIN": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "ALTER": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "CURSOR": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "_LIST": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "_CREATEIFNX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "DICTDEL": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "ADD": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "ALIASDEL": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SEARCH": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SYNDUMP": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SUGDEL": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "SUGADD": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "_DROPINDEXIFX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SYNUPDATE": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "MGET": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "GET": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "AGGREGATE": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SUGLEN": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "DEL": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "_ALIASDELIFX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "_ALIASADDIFNX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "DROPINDEX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "_ALTERIFNX": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "PROFILE": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "CREATE": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "INFO": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "DICTDUMP": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    }
  },
  "json": {
    "strlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mget": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "set": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "clear": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "arrpop": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "arrinsert": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "objkeys": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "type": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "debug": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "strappend": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "get": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "arrtrim": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "del": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mset": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "numincrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "forget": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "arrlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "arrindex": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "nummultby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "objlen": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "numpowby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "arrappend": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "merge": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "toggle": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "resp": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "cms": {
    "initbyprob": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "query": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "merge": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "info": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "incrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "initbydim": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "bf": {
    "loadchunk": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "debug": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "add": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "madd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mexists": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "insert": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "exists": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "card": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "info": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "reserve": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "scandump": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "ts": {
    "mrevrange": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "info": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mrange": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "alter": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "revrange": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "madd": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "createrule": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "del": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mget": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "get": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "create": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "add": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "range": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "queryindex": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "deleterule": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "decrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "incrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "tdigest": {
    "max": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "byrevrank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "info": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "byrank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "create": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "reset": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "merge": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "trimmed_mean": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "add": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "revrank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "min": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "cdf": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "rank": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "quantile": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "cf": {
    "count": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "debug": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "exists": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "compact": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "loadchunk": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "insertnx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "addnx": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "insert": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "reserve": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "scandump": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "info": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "mexists": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "add": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "del": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "topk": {
    "list": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "reserve": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "info": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "incrby": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "query": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "count": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "add": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    }
  },
  "search": {
    "CLUSTERSET": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "CLUSTERINFO": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "CLUSTERREFRESH": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    }
  },
  "_FT": {
    "CONFIG": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    },
    "SAFEADD": {
      "request": "default-keyed",
      "response": "default-keyed",
      "isKeyless": false
    },
    "DEBUG": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true,
      "subcommands": {
        "INFO_TAGIDX": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "VECSIM_INFO": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "SPEC_INVIDXES_INFO": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_HNSW": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "TTL_PAUSE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GC_FORCEBGINVOKE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "SHARD_CONNECTION_STATES": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GC_STOP_SCHEDULE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_TAGIDX": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "SET_MONITOR_EXPIRATION": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_TERMS": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GC_CONTINUE_SCHEDULE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_NUMIDX": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GC_CLEAN_NUMERIC": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "HELP": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "FT.AGGREGATE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "TTL": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_SUFFIX_TRIE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DOCINFO": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "_FT.AGGREGATE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "WORKERS": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "RESUME_TOPOLOGY_UPDATER": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_NUMIDXTREE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_INVIDX": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "CLEAR_PENDING_TOPOLOGY": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "_FT.SEARCH": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "BG_SCAN_CONTROLLER": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "PAUSE_TOPOLOGY_UPDATER": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GIT_SHA": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "IDTODOCID": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "INVIDX_SUMMARY": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_GEOMIDX": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GC_FORCEINVOKE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "TTL_EXPIRE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "FT.SEARCH": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_PHONETIC_HASH": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DOCIDTOID": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DUMP_PREFIX_TRIE": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "DELETE_LOCAL_CURSORS": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "GC_WAIT_FOR_JOBS": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        },
        "NUMIDX_SUMMARY": {
          "request": "default-keyless",
          "response": "default-keyless",
          "isKeyless": true
        }
      }
    }
  },
  "timeseries": {
    "REFRESHCLUSTER": {
      "request": "default-keyless",
      "response": "default-keyless",
      "isKeyless": true
    }
  }
} as const;
