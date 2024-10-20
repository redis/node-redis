import type { RedisCommands } from '@redis/client/lib/RESP/types';
import INCRBY from './INCRBY';
import INFO from './INFO';
import INITBYDIM from './INITBYDIM';
import INITBYPROB from './INITBYPROB';
import MERGE from './MERGE';
import QUERY from './QUERY';

export default {
  INCRBY,
  incrBy: INCRBY,
  INFO,
  info: INFO,
  INITBYDIM,
  initByDim: INITBYDIM,
  INITBYPROB,
  initByProb: INITBYPROB,
  MERGE,
  merge: MERGE,
  QUERY,
  query: QUERY
} as const satisfies RedisCommands;
