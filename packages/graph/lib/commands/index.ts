import type { RedisCommands } from '@redis/client/lib/RESP/types';
import CONFIG_GET from './CONFIG_GET';
import CONFIG_SET from './CONFIG_SET';;
import DELETE from './DELETE';
import EXPLAIN from './EXPLAIN';
import LIST from './LIST';
import PROFILE from './PROFILE';
import QUERY from './QUERY';
import RO_QUERY from './RO_QUERY';
import SLOWLOG from './SLOWLOG';

export default {
  CONFIG_GET,
  configGet: CONFIG_GET,
  CONFIG_SET,
  configSet: CONFIG_SET,
  DELETE,
  delete: DELETE,
  EXPLAIN,
  explain: EXPLAIN,
  LIST,
  list: LIST,
  PROFILE,
  profile: PROFILE,
  QUERY,
  query: QUERY,
  RO_QUERY,
  roQuery: RO_QUERY,
  SLOWLOG,
  slowLog: SLOWLOG
} as const satisfies RedisCommands;
