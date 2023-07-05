import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import INCRBY from './INCRBY';
import INFO from './INFO';
import INITBYDIM from './INITBYDIM';
import INITBYPROB from './INITBYPROB';
import MERGE from './MERGE';
import QUERY from './QUERY';

type INCRBY = typeof import('./INCRBY').default;
type INFO = typeof import('./INFO').default;
type INITBYDIM = typeof import('./INITBYDIM').default;
type INITBYPROB = typeof import('./INITBYPROB').default;
type MERGE = typeof import('./MERGE').default;
type QUERY = typeof import('./QUERY').default;

export default {
  INCRBY: INCRBY as INCRBY,
  incrBy: INCRBY as INCRBY,
  INFO: INFO as INFO,
  info: INFO as INFO,
  INITBYDIM: INITBYDIM as INITBYDIM,
  initByDim: INITBYDIM as INITBYDIM,
  INITBYPROB: INITBYPROB as INITBYPROB,
  initByProb: INITBYPROB as INITBYPROB,
  MERGE: MERGE as MERGE,
  merge: MERGE as MERGE,
  QUERY: QUERY as QUERY,
  query: QUERY as QUERY,
} satisfies RedisCommands;
