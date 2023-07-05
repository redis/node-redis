import ADD from './ADD';
import BYRANK from './BYRANK';
import BYREVRANK from './BYREVRANK';
import CDF from './CDF';
import CREATE from './CREATE';
// import INFO from './INFO';
import MAX from './MAX';
import MERGE from './MERGE';
import MIN from './MIN';
import QUANTILE from './QUANTILE';
import RANK from './RANK';
import RESET from './RESET';
import REVRANK from './REVRANK';
import TRIMMED_MEAN from './TRIMMED_MEAN';

type ADD = typeof import('./ADD').default;
type BYRANK = typeof import('./BYRANK').default;
type BYREVRANK = typeof import('./BYREVRANK').default;
type CDF = typeof import('./CDF').default;
type CREATE = typeof import('./CREATE').default;
// type INFO = typeof import('./INFO').default;
type MAX = typeof import('./MAX').default;
type MERGE = typeof import('./MERGE').default;
type MIN = typeof import('./MIN').default;
type QUANTILE = typeof import('./QUANTILE').default;
type RANK = typeof import('./RANK').default;
type RESET = typeof import('./RESET').default;
type REVRANK = typeof import('./REVRANK').default;
type TRIMMED_MEAN = typeof import('./TRIMMED_MEAN').default;

export default {
  ADD: ADD as ADD,
  add: ADD as ADD,
  BYRANK: BYRANK as BYRANK,
  byRank: BYRANK as BYRANK,
  BYREVRANK: BYREVRANK as BYREVRANK,
  byRevRank: BYREVRANK as BYREVRANK,
  CDF: CDF as CDF,
  cdf: CDF as CDF,
  CREATE: CREATE as CREATE,
  create: CREATE as CREATE,
  // INFO: INFO as INFO,
  // info: INFO as INFO,
  MAX: MAX as MAX,
  max: MAX as MAX,
  MERGE: MERGE as MERGE,
  merge: MERGE as MERGE,
  MIN: MIN as MIN,
  min: MIN as MIN,
  QUANTILE: QUANTILE as QUANTILE,
  quantile: QUANTILE as QUANTILE,
  RANK: RANK as RANK,
  rank: RANK as RANK,
  RESET: RESET as RESET,
  reset: RESET as RESET,
  REVRANK: REVRANK as REVRANK,
  revRank: REVRANK as REVRANK,
  TRIMMED_MEAN: TRIMMED_MEAN as TRIMMED_MEAN,
  trimmedMean: TRIMMED_MEAN as TRIMMED_MEAN
};
