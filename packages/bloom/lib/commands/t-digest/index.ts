import type { RedisCommands } from '@redis/client/lib/RESP/types';
import ADD from './ADD';
import BYRANK from './BYRANK';
import BYREVRANK from './BYREVRANK';
import CDF from './CDF';
import CREATE from './CREATE';
import INFO from './INFO';
import MAX from './MAX';
import MERGE from './MERGE';
import MIN from './MIN';
import QUANTILE from './QUANTILE';
import RANK from './RANK';
import RESET from './RESET';
import REVRANK from './REVRANK';
import TRIMMED_MEAN from './TRIMMED_MEAN';

export default {
  ADD,
  add: ADD,
  BYRANK,
  byRank: BYRANK,
  BYREVRANK,
  byRevRank: BYREVRANK,
  CDF,
  cdf: CDF,
  CREATE,
  create: CREATE,
  INFO,
  info: INFO,
  MAX,
  max: MAX,
  MERGE,
  merge: MERGE,
  MIN,
  min: MIN,
  QUANTILE,
  quantile: QUANTILE,
  RANK,
  rank: RANK,
  RESET,
  reset: RESET,
  REVRANK,
  revRank: REVRANK,
  TRIMMED_MEAN,
  trimmedMean: TRIMMED_MEAN
} as const satisfies RedisCommands;
