import type { RedisCommands } from '@redis/client/lib/RESP/types';
import ADD from './ADD';
import COUNT from './COUNT';
import INCRBY from './INCRBY';
import INFO from './INFO';
import LIST_WITHCOUNT from './LIST_WITHCOUNT';
import LIST from './LIST';
import QUERY from './QUERY';
import RESERVE from './RESERVE';

export default {
  ADD,
  add: ADD,
  COUNT,
  count: COUNT,
  INCRBY,
  incrBy: INCRBY,
  INFO,
  info: INFO,
  LIST_WITHCOUNT,
  listWithCount: LIST_WITHCOUNT,
  LIST,
  list: LIST,
  QUERY,
  query: QUERY,
  RESERVE,
  reserve: RESERVE
} as const satisfies RedisCommands;
